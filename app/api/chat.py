from fastapi import APIRouter
from schemas.chat import ChatRequest, ChatResponse, Reference
from services.chatbot import generate_response
from services.mongodb import mongodb
from services.articles import articles_service
from typing import List, Any

router = APIRouter()

async def format_references(source_docs: List[Any]) -> List[Reference]:
    """Format source documents into readable references - only documentation sources"""
    references = []
    seen_sources = set()
    
    for doc in source_docs:
        # Only return top 3 references
        if len(references) >= 3:
            break

        metadata = doc.metadata
        source_type = metadata.get("source", "unknown")
        
        # Skip chat history sources (Chroma docs have UUID in source field)
        if source_type == "chat_history":
            continue

        # For Chroma/vector DB documents - source is always a UUID
        source_uuid = metadata.get("source", "Documentation")

        # Only add if not already seen
        if source_uuid in seen_sources:
            continue

        # Query articles service to get title and URL
        try:
            article = await articles_service.get_article(source_uuid)
            if article:
                references.append(Reference(
                    title=article.title,
                    url=article.url
                ))
            else:
                # Fallback if article not found
                references.append(Reference(
                    title="Documentation",
                    url=source_uuid
                ))
        except Exception as e:
            print(f"Error fetching article's title and url {source_uuid}: {e}")
        seen_sources.add(source_uuid)

    return references

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    response = await generate_response(request.question)
    answer = response["answer"]
    source_docs = response["source_docs"]

    # Format references
    references = await format_references(source_docs)

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