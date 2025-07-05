from fastapi import APIRouter
from schemas.chat import ChatRequest, ChatResponse, Reference
from services.chatbot import generate_response
from services.mongodb import mongodb
from typing import List, Any

router = APIRouter()

def format_references(source_docs: List[Any]) -> List[Reference]:
    """Format source documents into readable references - only documentation sources"""
    references = []
    seen_sources = set()
    
    for doc in source_docs:
        metadata = doc.metadata
        source_type = metadata.get("source", "unknown")
        
        # Only include documentation sources, skip chat history
        if source_type != "chat_history":
            # For Chroma/vector DB documents
            source_file = metadata.get("source", "Documentation")
            
            # Only add if not already seen
            if source_file not in seen_sources:
                references.append(Reference(
                    title=source_file,
                    url=source_file
                ))
                seen_sources.add(source_file)
    
    return references

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    response = await generate_response(request.question)
    answer = response["answer"]
    source_docs = response["source_docs"]

    # Format references
    references = format_references(source_docs)

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