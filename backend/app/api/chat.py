from fastapi import APIRouter, Query
from app.services.llama_agent import agent

router = APIRouter()


@router.post("/chat")
async def chat(message: str = Query(..., description="The message to send to the AI")):
    """Simple chat endpoint using SambaNova Llama-4-Maverick model."""
    result = await agent.run(message)
    return {"response": result.output}
