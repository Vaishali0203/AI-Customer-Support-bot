from langchain_chroma import Chroma
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI
from langchain.retrievers.ensemble import EnsembleRetriever
from dotenv import load_dotenv
import os
from .mongodb import mongodb, mongodb_retriever
import openai

load_dotenv()
top_dir = os.environ.get("TOP_DIR")
chroma_dir_path = os.path.join(top_dir, os.environ.get("CHROMA_DIR"))

# Load the vectorstore
vectordb = Chroma(persist_directory=chroma_dir_path, embedding_function=OpenAIEmbeddings())
vector_retriever = vectordb.as_retriever()

# Create ensemble retriever combining both vector DB and MongoDB
ensemble_retriever = EnsembleRetriever(
    retrievers=[vector_retriever, mongodb_retriever],
    weights=[0.7, 0.3]  # 70% weight to vector DB, 30% to MongoDB chat history
)

# Setup retrieval-based QA chain with ensemble retriever
qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(temperature=0),
    chain_type="stuff",
    retriever=ensemble_retriever
)

def parse_history_to_openai_format(history):
    chat_history = []
    for entry in history:
        chat_history.append({"role": "user", "content": entry["question"]})
        chat_history.append({"role": "assistant", "content": entry["answer"]})
    return chat_history

async def generate_response(question: str) -> str:
    # Use qa_chain to generate the answer with ensemble context
    answer = qa_chain.run(question)
    return answer

