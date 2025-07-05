from dotenv import load_dotenv
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI
from typing import Dict, List, Any

from prompts.support_prompt import support_prompt
from retrievers.ensemble_retriever import ensemble_retriever
from schemas.chat import Reference

load_dotenv()

# Setup retrieval-based QA chain with custom prompt
qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(temperature=0.3),  # Higher temperature for natural responses
    chain_type="stuff",
    retriever=ensemble_retriever,
    chain_type_kwargs={"prompt": support_prompt},
    return_source_documents=True  # Enable source document retrieval
)

async def generate_response(question: str) -> Dict[str, Any]:
    # Use qa_chain to generate the answer with ensemble context
    result = qa_chain({"query": question})
    
    # Extract answer and source documents
    answer = result["result"]
    source_docs = result["source_documents"]
    
    # Format references
    references = format_references(source_docs)
    
    return {
        "answer": answer,
        "references": references
    }

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
