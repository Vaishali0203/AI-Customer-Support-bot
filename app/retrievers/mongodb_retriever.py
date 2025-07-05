from typing import List, Any

from langchain.schema import Document
from langchain_core.retrievers import BaseRetriever

from services.mongodb import mongodb

class MongoDBRetriever(BaseRetriever):
    """Simple MongoDB retriever that returns the last 5 chats for context"""
    
    mongodb_instance: Any
    limit: int
    
    @classmethod
    def create(cls, mongodb_instance, limit: int = 5):
        """Factory method to create MongoDBRetriever"""
        return cls(mongodb_instance=mongodb_instance, limit=limit)

    def _get_relevant_documents(self, query: str) -> List[Document]:
        """Simply return the last N chats for conversation context"""
        try:
            # Use the sync method from MongoDB instance
            results = self.mongodb_instance.get_chat_history_sync(self.limit)
            
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


# Create retriever using existing MongoDB instance
mongodb_retriever = MongoDBRetriever.create(mongodb) 