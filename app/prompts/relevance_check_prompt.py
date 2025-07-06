from langchain.prompts import PromptTemplate

# Relevance checking prompt template for source documents
RELEVANCE_CHECK_TEMPLATE = """Given the user's question and a source document, 
determine if the source is relevant to answering the question.

User Question: {question}

Source Document Content: {document_content}

Is this source relevant to answering the user's question? 
Respond with only "YES" or "NO"."""

# Create the prompt template object
relevance_check_prompt = PromptTemplate(
    template=RELEVANCE_CHECK_TEMPLATE,
    input_variables=["question", "document_content"]
) 