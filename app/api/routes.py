from fastapi import APIRouter
from schemas.chat import ChatRequest
from services.chatbot import generate_response

router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Hello World"}

@router.post("/chat")
async def chat(request: ChatRequest):
    answer = generate_response(request.question)
    return {"answer": answer} 