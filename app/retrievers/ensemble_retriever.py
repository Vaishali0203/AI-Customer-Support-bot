from langchain.retrievers.ensemble import EnsembleRetriever

from retrievers.chroma_retriever import chroma_retriever
from retrievers.mongodb_retriever import mongodb_retriever

# Create ensemble retriever combining both vector DB and MongoDB
ensemble_retriever = EnsembleRetriever(
    retrievers=[chroma_retriever, mongodb_retriever],
    weights=[0.7, 0.3]  # 70% weight to vector DB, 30% to MongoDB
) 