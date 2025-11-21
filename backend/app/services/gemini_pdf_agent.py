from pydantic_ai import Agent, BinaryContent

# Create agent with Google Gemini for PDF processing
# Using gemini-2.5-flash for faster and cost-effective PDF text extraction
# Requires GOOGLE_API_KEY environment variable to be set
agent = Agent("google-gla:gemini-2.5-flash")


async def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Convert a PDF manual into a readable text-based manual using Google Gemini.

    Args:
        pdf_bytes: The PDF file as bytes

    Returns:
        Well-formatted text manual converted from the PDF
    """
    result = await agent.run(
        [
            "Convert this PDF manual into a clear, readable text-based manual in English. Organize the content logically with proper sections, steps, and formatting. Include all important information like titles, instructions, part lists, diagrams descriptions, warnings, and notes. Make it easy to follow and understand. Do not include any meta-commentary about the conversion process. Always respond in English.",
            BinaryContent(data=pdf_bytes, media_type="application/pdf"),
        ]
    )
    return result.output
