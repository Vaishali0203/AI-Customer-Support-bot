import os
from typing import List, Any

from langchain.schema import Document
from langchain_core.retrievers import BaseRetriever
from langchain_openai import ChatOpenAI

from services.mongodb import mongodb
from services.chroma import chroma_service
from prompts.query_enhancement_prompt import query_enhancement_prompt

class ChromaRetriever(BaseRetriever):
    """Context-aware Chroma retriever that enhances queries with conversation 
    history from a specific session"""
    
    mongodb_instance: Any
    llm: Any
    k: int
    session_id: str
    
    @classmethod
    def create(cls, mongodb_instance, session_id: str, k: int = 4):
        """Factory method to create ContextAwareChromaRetriever"""
        return cls(
            mongodb_instance=mongodb_instance,
            session_id=session_id,
            llm=ChatOpenAI(temperature=0.1),
            k=k
        )
    
    def _enhance_query_with_context(self, query: str) -> str:
        """Enhance the query with conversation context"""
        try:
            # Get recent chat history for this session
            recent_chats = self.mongodb_instance.get_chat_history_sync(self.session_id, 3)
            
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
            if not enhanced_query:
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
            
            # Use chroma service for similarity search (with built-in retry logic)
            docs = chroma_service.similarity_search(enhanced_query, k=self.k)
            
            # Add query enhancement info to metadata
            for doc in docs:
                doc.metadata["original_query"] = query
                doc.metadata["enhanced_query"] = enhanced_query
            
            return docs
            
        except Exception as e:
            print(f"Context-aware Chroma retriever error: {e}")
            return []  # Return empty list if everything fails

    async def _aget_relevant_documents(self, query: str) -> List[Document]:
        """Async version - delegates to sync version"""
        return self._get_relevant_documents(query)

def create_chroma_retriever(session_id: str):
    """Factory function to create session-aware ChromaDB retriever"""
    return ChromaRetriever.create(mongodb, session_id)