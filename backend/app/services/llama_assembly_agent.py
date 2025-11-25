from pydantic_ai import Agent, BinaryContent, ImageUrl, ModelMessagesTypeAdapter
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
    "Llama-4-Maverick-17B-128E-Instruct",
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
    image_urls: list[str] | None = None,
    manual_text: str | None = None,
    message_history: list[dict] | None = None,
):
    """
    Run the agent with optional file attachments, image URLs, manual context, and conversation history.

    Args:
        message: The text message/prompt
        files: List of tuples containing (file_bytes, filename, content_type) for binary files
        image_urls: List of image URLs to include (preferred over binary for images)
        manual_text: Optional product manual text from PDF extraction
        message_history: Optional conversation history (serialized messages)

    Returns:
        Agent run result
    """
    # Debug logging
    print(f"[Agent] Message length: {len(message)} chars")
    if manual_text:
        print(f"[Agent] Manual text length: {len(manual_text)} chars")
    if files:
        print(f"[Agent] Number of binary files: {len(files)}")
        for i, (file_bytes, filename, content_type) in enumerate(files):
            print(f"[Agent] File {i}: {filename}, type: {content_type}, size: {len(file_bytes)} bytes")
    if image_urls:
        print(f"[Agent] Number of image URLs: {len(image_urls)}")
        for i, url in enumerate(image_urls):
            print(f"[Agent] Image URL {i}: {url}")
    if message_history:
        print(f"[Agent] Message history entries: {len(message_history)}")

    # Create agent with system instruction if manual text is provided
    if manual_text:
        system_prompt = ASSEMBLY_SYSTEM_INSTRUCTION.format(manual_text=manual_text)
        print(f"[Agent] System prompt length: {len(system_prompt)} chars")
        agent_with_manual = Agent(model, system_prompt=system_prompt)
        active_agent = agent_with_manual
    else:
        active_agent = agent

    # Deserialize message history if provided
    deserialized_history = None
    if message_history:
        deserialized_history = ModelMessagesTypeAdapter.validate_python(message_history)

    # Build the input (message or message + files/images)
    if not files and not image_urls:
        user_input = message
        print("[Agent] User input: text only")
    else:
        # Build the input list with message and file contents
        input_parts = [message]

        # Add image URLs (preferred method for images)
        if image_urls:
            for url in image_urls:
                input_parts.append(ImageUrl(url=url))
                print(f"[Agent] Added ImageUrl: {url}")

        # Add binary files (for non-image files)
        if files:
            for file_bytes, filename, content_type in files:
                binary_content = BinaryContent(
                    data=file_bytes,
                    media_type=content_type,
                    identifier=filename,
                )
                input_parts.append(binary_content)
                print(f"[Agent] Added BinaryContent: {filename}, {content_type}, {len(file_bytes)} bytes")

        user_input = input_parts
        print(f"[Agent] User input: {len(input_parts)} parts (1 text + {len(input_parts)-1} attachments)")

    print("[Agent] About to call agent.run()...")
    # Run agent with message history if available
    if deserialized_history:
        result = await active_agent.run(user_input, message_history=deserialized_history)
    else:
        result = await active_agent.run(user_input)

    print("[Agent] Agent.run() completed successfully")
    return result
