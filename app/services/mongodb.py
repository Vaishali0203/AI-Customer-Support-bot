from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os

class MongoDB:
    def __init__(self):
        self.client = AsyncIOMotorClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
        self.db = self.client.chatbot
        self.chats = self.db.chats

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

mongodb = MongoDB()