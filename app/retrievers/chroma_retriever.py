import os
from typing import List, Any

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.schema import Document
from langchain_core.retrievers import BaseRetriever
from langchain_openai import ChatOpenAI

from services.mongodb import mongodb
from prompts.query_enhancement_prompt import query_enhancement_prompt

# Load environment variables
load_dotenv()

# Setup Chroma vector database
top_dir = os.environ.get("TOP_DIR")
chroma_dir_path = os.path.join(top_dir, os.environ.get("CHROMA_DIR"))

# Create Chroma vectorstore
vectordb = Chroma(
    persist_directory=chroma_dir_path, 
    embedding_function=OpenAIEmbeddings()
)

class ContextAwareChromaRetriever(BaseRetriever):
    """Context-aware Chroma retriever that enhances queries with conversation 
    history"""
    
    vectorstore: Any
    mongodb_instance: Any
    llm: Any
    k: int
    
    @classmethod
    def create(cls, vectorstore, mongodb_instance, k: int = 4):
        """Factory method to create ContextAwareChromaRetriever"""
        return cls(
            vectorstore=vectorstore,
            mongodb_instance=mongodb_instance,
            llm=ChatOpenAI(temperature=0.1),
            k=k
        )
    
    def _enhance_query_with_context(self, query: str) -> str:
        """Enhance the query with conversation context"""
        try:
            # Get recent chat history
            recent_chats = self.mongodb_instance.get_chat_history_sync(3)
            
            if not recent_chats:
                return query
            
            # Build conversation context
            conversation_context = []
            for chat in reversed(recent_chats):  # Reverse for chronological order
                conversation_context.append(f"User: {chat['question']}")
                conversation_context.append(f"Assistant: {chat['answer']}")
            
            context_str = "\n".join(conversation_context)
            
            # Use the prompt template from prompts folder
            enhancement_prompt_str = query_enhancement_prompt.format(
                conversation_history=context_str,
                current_question=query
            )
            
            enhanced_query = self.llm.invoke(enhancement_prompt_str).content.strip()
            
            # Fallback to original query if enhancement fails
            if not enhanced_query or len(enhanced_query) < 5:
                return query
                
            return enhanced_query
            
        except Exception as e:
            print(f"Query enhancement error: {e}")
            return query
    
    def _get_relevant_documents(self, query: str) -> List[Document]:
        """Get relevant documents using enhanced query"""
        try:
            # Enhance query with conversation context
            enhanced_query = self._enhance_query_with_context(query)
            
            # Search with enhanced query
            docs = self.vectorstore.similarity_search(
                enhanced_query, 
                k=self.k
            )
            
            # Add query enhancement info to metadata
            for doc in docs:
                doc.metadata["original_query"] = query
                doc.metadata["enhanced_query"] = enhanced_query
            
            return docs
            
        except Exception as e:
            print(f"Context-aware Chroma retriever error: {e}")
            # Fallback to basic search
            return self.vectorstore.similarity_search(query, k=self.k)

    async def _aget_relevant_documents(self, query: str) -> List[Document]:
        """Async version - delegates to sync version"""
        return self._get_relevant_documents(query)

# Create context-aware retriever
chroma_retriever = ContextAwareChromaRetriever.create(vectordb, mongodb) 