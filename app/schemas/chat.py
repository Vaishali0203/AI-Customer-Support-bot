from pydantic import BaseModel
from typing import List

class ChatRequest(BaseModel):
    question: str
    session_id: str

class Reference(BaseModel):
    title: str
    url: str

class ChatResponse(BaseModel):
    answer: str
    references: List[Reference]