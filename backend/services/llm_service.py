"""Shared LLM service using LangChain + Groq."""

import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

def get_llm(temperature: float = 0.7, model: str = "openai/gpt-oss-120b"):
    """Get a ChatGroq LLM instance."""
    if not GROQ_API_KEY:
        raise ValueError(
            "GROQ_API_KEY is not set. Please set it in your .env file. "
            "Get a free key at https://console.groq.com"
        )
    return ChatGroq(
        api_key=GROQ_API_KEY,
        model=model,
        temperature=temperature,
        max_tokens=8000,
    )


async def quick_llm_call(system_prompt: str, user_prompt: str, temperature: float = 0.3) -> str:
    """Make a quick LLM call and return the response text."""
    llm = get_llm(temperature=temperature)
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]
    response = await llm.ainvoke(messages)
    return response.content
