from fastapi import APIRouter
from schemas.chat import ChatRequest
from services.chatbot import generate_response
from services.mongodb import mongodb

router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Hello World"}

@router.post("/chat")
async def chat(request: ChatRequest):
    answer = await generate_response(request.question)
    await mongodb.store_chat(request.question, answer)
    return {"answer": answer}

@router.get("/chat/history")
async def get_chat_history(limit: int = 10):
    history = await mongodb.get_chat_history(limit)
    return {"history": [{"question": doc["question"], "answer": doc["answer"], "timestamp": doc["timestamp"]} for doc in history]}