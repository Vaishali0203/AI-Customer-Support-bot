from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

# Load the vectorstore
vectordb = Chroma(persist_directory="chroma_db", embedding_function=OpenAIEmbeddings())

# Setup retrieval-based QA chain
qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(temperature=0),
    chain_type="stuff",
    retriever=vectordb.as_retriever()
)

while True:
    query = input("🧠 Ask something about Ardoq: ")
    if query.lower() in ["exit", "quit"]:
        break
    answer = qa_chain.run(query)
    print("🤖", answer)
