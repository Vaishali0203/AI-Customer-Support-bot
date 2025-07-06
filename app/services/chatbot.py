from dotenv import load_dotenv
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI
from typing import Dict, List, Any

from prompts.customer_support_prompt import support_prompt
from retrievers.ensemble_retriever import ensemble_retriever

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
    
    return {
        "answer": answer,
        "source_docs": source_docs
    }