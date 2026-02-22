"""Productivity Analyzer Agent — analyzes patterns and identifies weaknesses."""

from services.llm_service import quick_llm_call
import json

SYSTEM_PROMPT = """You are an expert productivity coach and data analyst. You analyze a user's task completion data, daily logs, and goal progress to provide actionable insights.

Your analysis should include:
1. **Productivity Patterns**: When is the user most/least productive?
2. **Strengths**: What the user is doing well
3. **Weaknesses**: Areas that need improvement
4. **Bottlenecks**: Tasks or categories with low completion rates
5. **Recommendations**: 3-5 specific, actionable suggestions

Format your response in clear markdown with headers, bullet points, and emojis for visual appeal.
Be encouraging but honest. Use data to support your observations.
Keep the response concise but comprehensive — around 300-500 words."""


async def analyze_productivity(data: dict, user_prompt: str = "") -> str:
    """Analyze productivity patterns and provide insights."""
    data_summary = json.dumps(data, indent=2, default=str)
    
    user_message = f"""Analyze this productivity data and provide insights:

{data_summary}

{f"Additional context from user: {user_prompt}" if user_prompt else ""}

Provide a comprehensive but concise analysis with actionable recommendations."""
    
    return await quick_llm_call(SYSTEM_PROMPT, user_message)
