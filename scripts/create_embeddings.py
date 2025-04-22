import os
from dotenv import load_dotenv
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings  # ✅ Updated import

# Load .env
load_dotenv()

ARTICLES_DIR = "articles"

# Load all text files
docs = []
for file in os.listdir(ARTICLES_DIR):
    if file.endswith(".txt"):
        loader = TextLoader(os.path.join(ARTICLES_DIR, file))
        docs.extend(loader.load())

# Split into smaller chunks
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
chunks = splitter.split_documents(docs)

# Create embeddings
embedding = OpenAIEmbeddings()

# Save to Chroma
vectordb = Chroma.from_documents(chunks, embedding, persist_directory="chroma_db")
vectordb.persist()

print("✅ Embeddings stored in Chroma.")
