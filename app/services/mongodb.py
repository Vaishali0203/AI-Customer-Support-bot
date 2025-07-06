import os
from datetime import datetime, timezone
from typing import List

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient

class MongoDB:
    def __init__(self):
        # Create clients locally
        async_client = AsyncIOMotorClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
        sync_client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
        
        # Store only the collections we need
        self.chats = async_client.chatbot.chats  # Async collection for API operations
        self.sync_chats = sync_client.chatbot.chats  # Sync collection for retriever operations

    async def store_chat(self, question: str, answer: str, session_id: str):
        chat_document = {
            "question": question,
            "answer": answer,
            "session_id": session_id,
            "timestamp": datetime.now(timezone.utc)
        }
        await self.chats.insert_one(chat_document)

    async def get_chat_history(self, session_id: str, limit: int = 10):
        query = {"session_id": session_id}
        cursor = self.chats.find(query).sort("timestamp", -1).limit(limit)
        return await cursor.to_list(length=limit)

    def get_chat_history_sync(self, session_id: str, limit: int = 10):
        """Synchronous version of get_chat_history for retriever operations"""
        try:
            query = {"session_id": session_id}
            pipeline = [
                {"$match": query},
                {"$sort": {"timestamp": -1}},
                {"$limit": limit}
            ]
            
            results = list(self.sync_chats.aggregate(pipeline))
            return results
        except Exception as e:
            print(f"MongoDB Sync Error: {e}")
            return []

    async def delete_chats_by_session(self, session_id: str):
        """Delete all chats for a specific session"""
        result = await self.chats.delete_many({"session_id": session_id})
        return result.deleted_count

mongodb = MongoDB()
