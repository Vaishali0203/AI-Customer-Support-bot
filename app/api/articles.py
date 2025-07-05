from fastapi import APIRouter, HTTPException
from services.articles import articles_service, Article

router = APIRouter()

@router.post("/articles", response_model=dict)
async def create_article(title: str, url: str):
    article_id = await articles_service.store_article(title, url)
    return {"id": article_id}

@router.get("/articles/{article_id}", response_model=Article)
async def get_article(article_id: str):
    article = await articles_service.get_article(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.delete("/articles/{article_id}")
async def delete_article(article_id: str):
    deleted = await articles_service.delete_article(article_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"message": "Article deleted successfully"}

@router.get("/articles/older-than/{timestamp}", response_model=list[Article])
async def get_articles_older_than(timestamp: str, limit: int = 10, offset: int = 0):
    from datetime import datetime
    try:
        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        articles = await articles_service.get_articles_older_than(dt, limit, offset)
        return articles
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp format") 