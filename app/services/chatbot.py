from dotenv import load_dotenv
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI

from prompts.support_prompt import support_prompt
from retrievers.ensemble_retriever import ensemble_retriever

load_dotenv()

# Setup retrieval-based QA chain with custom prompt
qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(temperature=0.3),  # Higher temperature for natural responses
    chain_type="stuff",
    retriever=ensemble_retriever,
    chain_type_kwargs={"prompt": support_prompt}
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

