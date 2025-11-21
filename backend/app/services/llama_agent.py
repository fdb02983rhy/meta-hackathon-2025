from pydantic_ai import Agent, BinaryContent
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


async def run_agent_with_files(
    message: str, files: list[tuple[bytes, str, str]] | None = None
):
    """
    Run the agent with optional file attachments.

    Args:
        message: The text message/prompt
        files: List of tuples containing (file_bytes, filename, content_type)

    Returns:
        Agent run result
    """
    if not files:
        return await agent.run(message)

    # Build the input list with message and file contents
    input_parts = [message]

    for file_bytes, filename, content_type in files:
        # Add file as BinaryContent
        input_parts.append(
            BinaryContent(
                data=file_bytes,
                media_type=content_type,
                identifier=filename,
            )
        )

    return await agent.run(input_parts)
