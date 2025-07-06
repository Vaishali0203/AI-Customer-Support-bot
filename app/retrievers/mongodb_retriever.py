from typing import List, Any

from langchain.schema import Document
from langchain_core.retrievers import BaseRetriever

from services.mongodb import mongodb

class MongoDBRetriever(BaseRetriever):
    """MongoDB retriever that returns the last 5 chats for context from a specific session"""
    
    mongodb_instance: Any
    limit: int
    session_id: str
    
    @classmethod
    def create(cls, mongodb_instance, session_id: str, limit: int = 5):
        """Factory method to create MongoDBRetriever"""
        return cls(mongodb_instance=mongodb_instance, session_id=session_id, limit=limit)

    def _get_relevant_documents(self, query: str) -> List[Document]:
        """Return the last N chats for conversation context from specific session"""
        try:
            # Use the sync method from MongoDB instance with session_id
            results = self.mongodb_instance.get_chat_history_sync(self.session_id, self.limit)
            
            documents = []
            for result in results:
                # Create document from Q&A pair
                content = (f"Previous conversation:\n"
                          f"User: {result['question']}\n"
                          f"Assistant: {result['answer']}")
                doc = Document(
                    page_content=content,
                    metadata={
                        "source": "chat_history",
                        "timestamp": result["timestamp"],
                        "question": result["question"],
                        "answer": result["answer"]
                    }
                )
                documents.append(doc)
            
            return documents

        except Exception as e:
            print(f"MongoDB Retriever Error: {e}")
            return []

    async def _aget_relevant_documents(self, query: str) -> List[Document]:
        """Async version - delegates to sync version"""
        return self._get_relevant_documents(query) 