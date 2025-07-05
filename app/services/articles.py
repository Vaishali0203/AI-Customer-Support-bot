import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

class Article(BaseModel):
    id: str
    title: str
    url: str
    timestamp: datetime

class ArticlesService:
    def __init__(self):
        client = AsyncIOMotorClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
        self.articles = client.articles.documents

    async def store_article(self, title: str, url: str) -> str:
        article_id = str(uuid.uuid4())
        article = {
            "id": article_id,
            "title": title,
            "url": url,
            "timestamp": datetime.now(timezone.utc)
        }
        await self.articles.insert_one(article)
        return article_id

    async def get_article(self, article_id: str) -> Optional[Article]:
        document = await self.articles.find_one({"id": article_id})
        if document:
            return Article(
                id=document["id"],
                title=document["title"],
                url=document["url"],
                timestamp=document["timestamp"]
            )
        return None

    async def get_articles_older_than(self, timestamp: datetime, limit: int = 10, offset: int = 0) -> List[Article]:
        cursor = self.articles.find({"timestamp": {"$lt": timestamp}}).skip(offset).limit(limit)
        articles = []
        async for document in cursor:
            articles.append(Article(
                id=document["id"],
                title=document["title"],
                url=document["url"],
                timestamp=document["timestamp"]
            ))
        return articles

    async def delete_article(self, article_id: str) -> bool:
        result = await self.articles.delete_one({"id": article_id})
        return result.deleted_count > 0

articles_service = ArticlesService() 