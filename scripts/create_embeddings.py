import os
from dotenv import load_dotenv
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

# Load .env
load_dotenv()
top_dir = os.environ.get("TOP_DIR")
articles_dir = os.environ.get("ARTICLES_DIR")
chroma_dir = os.environ.get("CHROMA_DIR")
articles_dir_path = os.path.join(top_dir, articles_dir)
chroma_dir_path = os.path.join(top_dir, chroma_dir)

# Load all text files
docs = []
for file in os.listdir(articles_dir_path):
    if file.endswith(".txt"):
        loader = TextLoader(os.path.join(articles_dir_path, file))
        docs.extend(loader.load())

# Split into smaller chunks
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
chunks = splitter.split_documents(docs)

# Create embeddings
embedding = OpenAIEmbeddings()

# Save to Chroma
vectordb = Chroma.from_documents(chunks, embedding, persist_directory=chroma_dir_path)
vectordb.persist()

print("✅ Embeddings stored in Chroma.")