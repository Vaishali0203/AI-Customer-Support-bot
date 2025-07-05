from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from datetime import datetime, timezone
import os
from langchain.schema import Document
from langchain_core.retrievers import BaseRetriever
from typing import List, Any

class MongoDB:
    def __init__(self):
        # Create clients locally
        async_client = AsyncIOMotorClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
        sync_client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
        
        # Store only the collections we need
        self.chats = async_client.chatbot.chats  # Async collection for API operations
        self.sync_chats = sync_client.chatbot.chats  # Sync collection for retriever operations

    async def store_chat(self, question: str, answer: str):
        chat_document = {
            "question": question,
            "answer": answer,
            "timestamp": datetime.now(timezone.utc)
        }
        await self.chats.insert_one(chat_document)

    async def get_chat_history(self, limit: int = 10):
        cursor = self.chats.find().sort("timestamp", -1).limit(limit)
        return await cursor.to_list(length=limit)

    def get_chat_history_sync(self, limit: int = 10):
        """Synchronous version of get_chat_history for retriever operations"""
        try:
            pipeline = [
                {"$sort": {"timestamp": -1}},
                {"$limit": limit}
            ]
            
            results = list(self.sync_chats.aggregate(pipeline))
            return results
        except Exception as e:
            print(f"MongoDB Sync Error: {e}")
            return []

class MongoDBRetriever(BaseRetriever):
    """Simple MongoDB retriever that returns the last 5 chats for context"""
    
    mongodb_instance: Any
    limit: int
    
    @classmethod
    def create(cls, mongodb_instance: MongoDB, limit: int = 5):
        """Factory method to create MongoDBRetriever - reuses MongoDB instance's sync client"""
        return cls(mongodb_instance=mongodb_instance, limit=limit)

    def _get_relevant_documents(self, query: str) -> List[Document]:
        """Simply return the last N chats for conversation context"""
        try:
            # Use the sync method from MongoDB instance
            results = self.mongodb_instance.get_chat_history_sync(self.limit)
            
            documents = []
            for result in results:
                # Create document from Q&A pair
                content = f"Previous conversation:\nUser: {result['question']}\nAssistant: {result['answer']}"
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

mongodb = MongoDB()
mongodb_retriever = MongoDBRetriever.create(mongodb)
