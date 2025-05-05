from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI
from dotenv import load_dotenv
import os

load_dotenv()
top_dir = os.environ.get("TOP_DIR")

# Load the vectorstore
vectordb = Chroma(persist_directory=(top_dir + "/chroma_db"), embedding_function=OpenAIEmbeddings())

# Setup retrieval-based QA chain
qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(temperature=0),
    chain_type="stuff",
    retriever=vectordb.as_retriever()
)

def generate_response(question: str) -> str:
    answer = qa_chain.run(question)
    return answer

