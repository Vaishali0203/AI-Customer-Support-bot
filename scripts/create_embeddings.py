import os
import shutil
from dotenv import load_dotenv
from langchain_community.document_loaders import TextLoader, DirectoryLoader
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
loader = DirectoryLoader(articles_dir_path, glob="*", loader_cls=TextLoader)
docs = loader.load()
# Still need to clean metadata
for doc in docs:
    doc.metadata['source'] = os.path.basename(doc.metadata['source'])

# Split into smaller chunks
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
chunks = splitter.split_documents(docs)

# Create embeddings
embedding = OpenAIEmbeddings()

# Atomic rename - create in temp directory then move
temp_dir = chroma_dir_path.rstrip('/') + ".tmp"
vectordb = Chroma.from_documents(chunks, embedding, 
                                persist_directory=temp_dir)
vectordb.persist()

# Remove old data and atomically move new data
if os.path.exists(chroma_dir_path):
    shutil.rmtree(chroma_dir_path)
os.rename(temp_dir, chroma_dir_path)

print("✅ Embeddings stored in Chroma.")