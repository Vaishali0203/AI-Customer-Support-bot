from fastapi import APIRouter
from schemas.chat import ChatRequest, ChatResponse, Reference
from services.chatbot import generate_response
from services.mongodb import mongodb
from services.articles import articles_service
from typing import List, Any
from langchain_openai import ChatOpenAI
from prompts.relevance_check_prompt import relevance_check_prompt

router = APIRouter()

# LLM for relevance checking
relevance_llm = ChatOpenAI(temperature=0.1)

async def is_relevant_source(question: str, doc_content: str) -> bool:
    """Check if a source document is relevant to the user's question"""
    try:
        # Use the prompt template from prompts folder
        relevance_prompt_str = relevance_check_prompt.format(
            question=question,
            document_content=doc_content[:500] + "..."
        )

        response = relevance_llm.invoke(relevance_prompt_str).content.strip().upper()
        return response == "YES"
    except Exception as e:
        print(f"Relevance check error: {e}")
        # Default to including the reference if check fails
        return True

async def format_references(source_docs: List[Any], question: str) -> List[Reference]:
    """Format source documents into readable references - only relevant documentation sources"""
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

        # Check if this source is relevant to the question
        if not await is_relevant_source(question, doc.page_content):
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
    response = await generate_response(request.question, request.session_id)
    answer = response["answer"]
    source_docs = response["source_docs"]

    # Format references with relevance checking
    references = await format_references(source_docs, request.question)

    # Store chat in MongoDB with session ID
    await mongodb.store_chat(request.question, answer, request.session_id)

    return ChatResponse(
        answer=answer,
        references=references
    )

@router.get("/chat/history")
async def get_chat_history(session_id: str, limit: int = 10):
    history = await mongodb.get_chat_history(session_id, limit)
    return {
        "history": [
            {
                "question": doc["question"], 
                "answer": doc["answer"], 
                "session_id": doc["session_id"],
                "timestamp": doc["timestamp"]
            } 
            for doc in history
        ]
    }

@router.delete("/chat/session/{session_id}")
async def delete_session_chats(session_id: str):
    deleted_count = await mongodb.delete_chats_by_session(session_id)
    return {
        "message": f"Deleted {deleted_count} chats for session {session_id}",
        "deleted_count": deleted_count,
        "session_id": session_id
    } 