"""Note Assistant Agent — helps create and enhance markdown notes."""

from services.llm_service import quick_llm_call

SYSTEM_PROMPT = """You are an intelligent note-taking assistant. You help users create, expand, summarize, and organize notes in markdown format.

You can help with:
1. **Create**: Generate structured markdown notes on a topic
2. **Expand**: Add more detail, examples, or explanations to existing notes
3. **Summarize**: Condense long notes into key points
4. **Organize**: Structure messy notes with headers, lists, and formatting
5. **Template**: Create note templates for meetings, learning, planning, etc.

Rules:
- Always output in clean, well-formatted markdown
- Use headers (##, ###), bullet points, code blocks, and tables where appropriate
- Include a title at the top
- Add relevant tags at the bottom as: `Tags: #tag1 #tag2 #tag3`
- Keep notes concise but comprehensive
- Use bold for key terms and concepts"""


async def assist_with_note(
    action: str,
    content: str = "",
    topic: str = "",
    user_prompt: str = "",
) -> str:
    """Assist with note creation and enhancement."""
    if action == "create":
        user_message = f"Create a comprehensive markdown note about: {topic}\n{f'Additional context: {user_prompt}' if user_prompt else ''}"
    elif action == "expand":
        user_message = f"Expand this note with more details and examples:\n\n{content}\n{f'Focus on: {user_prompt}' if user_prompt else ''}"
    elif action == "summarize":
        user_message = f"Summarize this note into key points:\n\n{content}"
    elif action == "organize":
        user_message = f"Reorganize and format this note with proper markdown structure:\n\n{content}"
    elif action == "template":
        user_message = f"Create a markdown note template for: {topic}"
    else:
        user_message = f"{user_prompt}\n\nExisting note content:\n{content}" if content else user_prompt
    
    return await quick_llm_call(SYSTEM_PROMPT, user_message, temperature=0.4)
