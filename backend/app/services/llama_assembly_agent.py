from pydantic_ai import Agent, BinaryContent, ModelMessagesTypeAdapter
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from app.core.config import settings


# System instruction template with variable for manual text
ASSEMBLY_SYSTEM_INSTRUCTION = """You are a helpful assembly guide assistant. You have access to the following product manual:

---BEGIN MANUAL---
{manual_text}
---END MANUAL---

Provide SHORT, CONVERSATIONAL responses like you're talking to someone. Use 1-2 sentences maximum, like oral conversation. Be direct and concise. Use simple language. If users ask about assembly steps, give brief, clear guidance from the manual.

IMPORTANT:
- Keep responses SHORT (1-2 sentences, like speaking)
- Be conversational and friendly
- Always respond in English, regardless of the language used in the user's question or the manual."""


# Create base model with SambaNova's Llama-4-Maverick
model = OpenAIChatModel(
    "Meta-Llama-3.3-70B-Instruct",
    provider=OpenAIProvider(
        base_url=settings.sambanova_base_url, api_key=settings.sambanova_api_key
    ),
)

# Default agent with short, conversational system instruction
DEFAULT_SYSTEM_INSTRUCTION = """You are a helpful assistant. Keep responses SHORT and CONVERSATIONAL, like oral conversation. Use 1-2 sentences maximum. Be direct, friendly, and concise. Always respond in English."""

agent = Agent(model, system_prompt=DEFAULT_SYSTEM_INSTRUCTION)


async def run_agent_with_files(
    message: str,
    files: list[tuple[bytes, str, str]] | None = None,
    manual_text: str | None = None,
    message_history: list[dict] | None = None,
):
    """
    Run the agent with optional file attachments, manual context, and conversation history.

    Args:
        message: The text message/prompt
        files: List of tuples containing (file_bytes, filename, content_type)
        manual_text: Optional product manual text from PDF extraction
        message_history: Optional conversation history (serialized messages)

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

    # Deserialize message history if provided
    deserialized_history = None
    if message_history:
        deserialized_history = ModelMessagesTypeAdapter.validate_python(message_history)

    # Build the input (message or message + files)
    if not files:
        user_input = message
    else:
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
        user_input = input_parts

    # Run agent with message history if available
    if deserialized_history:
        return await active_agent.run(user_input, message_history=deserialized_history)
    else:
        return await active_agent.run(user_input)
