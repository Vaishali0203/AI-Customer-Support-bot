from fastapi import APIRouter, HTTPException
from schemas.chat import ChatRequest, ChatResponse
from services.chatbot import generate_response
from services.mongodb import mongodb
from services.articles import articles_service, Article

router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Hello World"}

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    response = await generate_response(request.question)
    answer = response["answer"]
    references = response["references"]

    # Store chat in MongoDB
    await mongodb.store_chat(request.question, answer)

    return ChatResponse(
        answer=answer,
        references=references
    )

@router.get("/chat/history")
async def get_chat_history(limit: int = 10):
    history = await mongodb.get_chat_history(limit)
    return {
        "history": [
            {
                "question": doc["question"], 
                "answer": doc["answer"], 
                "timestamp": doc["timestamp"]
            } 
            for doc in history
        ]
    }

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