from langchain_chroma import Chroma
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import os
from .mongodb import mongodb
import openai

load_dotenv()
top_dir = os.environ.get("TOP_DIR")
chroma_dir_path = os.path.join(top_dir, os.environ.get("CHROMA_DIR"))

# Load the vectorstore
vectordb = Chroma(persist_directory=chroma_dir_path, embedding_function=OpenAIEmbeddings())

# Setup retrieval-based QA chain
qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(temperature=0),
    chain_type="stuff",
    retriever=vectordb.as_retriever()
)

def parse_history_to_openai_format(history):
    chat_history = []
    for entry in history:
        chat_history.append({"role": "user", "content": entry["question"]})
        chat_history.append({"role": "assistant", "content": entry["answer"]})
    return chat_history

async def generate_response(question: str) -> str:
    # Retrieve chat history from MongoDB
    history = await mongodb.get_chat_history(limit=10)
    chat_history = [
        item
        for doc in history
        for item in ({"role": "user", "content": doc["question"]}, {"role": "assistant", "content": doc["answer"]})
    ]

    # Prepare messages for OpenAI
    messages = [
        {"role": "system", "content": "You are a helpful assistant. Attached is the list previous interactions with the user. Use this information to answer the user's question."},
        *chat_history,
        {"role": "user", "content": question}
    ]

    print("Messages sent to OpenAI/qa_chain:", messages)

    # Convert messages to a single string prompt
    prompt = ""
    for msg in messages:
        prompt += f"{msg['role'].capitalize()}: {msg['content']}\n"
    
    # Use qa_chain to generate the answer
    answer = qa_chain.run(prompt)

    # Store the conversation in MongoDB
    await mongodb.store_chat(question, answer)
    return answer

