from fastapi import APIRouter
from api.chat import router as chat_router
from api.articles import router as articles_router

router = APIRouter()

@router.get("/health")
async def health():
    return {"status": "healthy"}

# Include chat routes
router.include_router(chat_router)

# Include articles routes
router.include_router(articles_router) 