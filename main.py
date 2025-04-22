from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
import openai
import os
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import TextLoader
from langchain.chains import ConversationalRetrievalChain
from langchain.chat_models import ChatOpenAI
import uuid

# Setup
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
client = MongoClient("your_mongo_uri")
db = client["chatdb"]
chat_collection = db["messages"]

# LangChain setup for RAG
docs = TextLoader("ardoq_articles.txt").load()
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
documents = splitter.split_documents(docs)

embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(documents, embedding=embeddings)

llm = ChatOpenAI(temperature=0, model_name="gpt-3.5-turbo")
qa_chain = ConversationalRetrievalChain.from_llm(llm, retriever=vectorstore.as_retriever())

# Pydantic model
class ChatRequest(BaseModel):
    user_id: str
    message: str

@app.post("/chat")
async def chat(req: ChatRequest):
    # Fetch last few messages
    history_docs = list(chat_collection.find({"user_id": req.user_id}).sort("timestamp", -1).limit(5))
    chat_history = [(doc["sender"], doc["text"]) for doc in reversed(history_docs)]

    # Get response from LangChain RAG
    result = qa_chain({"question": req.message, "chat_history": chat_history})
    reply = result["answer"]

    # Save both user and bot message
    chat_collection.insert_many([
        {"user_id": req.user_id, "sender": "User", "text": req.message, "timestamp": uuid.uuid1().time},
        {"user_id": req.user_id, "sender": "Bot", "text": reply, "timestamp": uuid.uuid1().time}
    ])

    return {"reply": reply}