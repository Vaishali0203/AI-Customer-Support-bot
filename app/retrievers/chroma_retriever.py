import os

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_community.embeddings import OpenAIEmbeddings

# Load environment variables
load_dotenv()

# Setup Chroma vector database
top_dir = os.environ.get("TOP_DIR")
chroma_dir_path = os.path.join(top_dir, os.environ.get("CHROMA_DIR"))

# Create Chroma vectorstore
vectordb = Chroma(
    persist_directory=chroma_dir_path, 
    embedding_function=OpenAIEmbeddings()
)

# Create retriever from vectorstore
chroma_retriever = vectordb.as_retriever() 