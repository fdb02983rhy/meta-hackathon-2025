from pydantic_ai import Agent, BinaryContent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from app.core.config import settings


# System instruction template with variable for manual text
ASSEMBLY_SYSTEM_INSTRUCTION = """You are an expert assembly guide assistant. You have access to the following product manual:

---BEGIN MANUAL---
{manual_text}
---END MANUAL---

Use this manual to provide accurate, step-by-step assembly guidance. Reference specific sections, parts, and instructions from the manual when answering questions. If users send images, analyze them in the context of the assembly process and the manual. Be helpful, clear, and safety-conscious. Always cite the relevant manual sections when providing guidance."""


# Create base model with SambaNova's Llama-4-Maverick
model = OpenAIChatModel(
    "Llama-4-Maverick-17B-128E-Instruct",
    provider=OpenAIProvider(
        base_url=settings.sambanova_base_url, api_key=settings.sambanova_api_key
    ),
)

# Default agent without system instruction
agent = Agent(model)


async def run_agent_with_files(
    message: str,
    files: list[tuple[bytes, str, str]] | None = None,
    manual_text: str | None = None,
):
    """
    Run the agent with optional file attachments and manual context.

    Args:
        message: The text message/prompt
        files: List of tuples containing (file_bytes, filename, content_type)
        manual_text: Optional product manual text from PDF extraction

    Returns:
        Agent run result
    """
    # Create agent with system instruction if manual text is provided
    if manual_text:
        system_prompt = ASSEMBLY_SYSTEM_INSTRUCTION.format(manual_text=manual_text)
        agent_with_manual = Agent(model, system_prompt=system_prompt)
        active_agent = agent_with_manual
    else:
        active_agent = agent

    if not files:
        return await active_agent.run(message)

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

    return await active_agent.run(input_parts)
