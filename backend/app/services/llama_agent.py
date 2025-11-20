from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from app.core.config import settings


# Create agent with SambaNova's Llama-4-Maverick model
model = OpenAIChatModel(
    "Llama-4-Maverick-17B-128E-Instruct",
    provider=OpenAIProvider(
        base_url=settings.sambanova_base_url, api_key=settings.sambanova_api_key
    ),
)

agent = Agent(model)
