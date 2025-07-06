from langchain.retrievers.ensemble import EnsembleRetriever

from retrievers.chroma_retriever import create_chroma_retriever
from retrievers.mongodb_retriever import MongoDBRetriever
from services.mongodb import mongodb

def create_ensemble_retriever(session_id: str):
    """Create ensemble retriever with session-aware retrievers"""
    # Create session-aware retrievers
    chroma_retriever = create_chroma_retriever(session_id)
    mongodb_retriever = MongoDBRetriever.create(mongodb, session_id)
    
    # Create ensemble retriever combining both sources
    return EnsembleRetriever(
        retrievers=[chroma_retriever, mongodb_retriever],
        weights=[0.7, 0.3]  # 70% weight to vector DB, 30% to MongoDB
    ) 