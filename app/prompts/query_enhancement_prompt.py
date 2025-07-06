from langchain.prompts import PromptTemplate

# Query enhancement prompt template for context-aware retrieval
QUERY_ENHANCEMENT_TEMPLATE = """Given the following conversation history and 
current question, create a short, focused search query that captures the key 
intent.

Conversation History:
{conversation_history}

Current Question: {current_question}

Instructions:
- Keep the enhanced query SHORT
- Focus on the core topic/intent
- Include relevant context from conversation history only if essential
- Use specific keywords that would match documentation

Enhanced Search Query (respond with only the short query, no explanations):"""

# Create the prompt template object
query_enhancement_prompt = PromptTemplate(
    template=QUERY_ENHANCEMENT_TEMPLATE,
    input_variables=["conversation_history", "current_question"]
) 