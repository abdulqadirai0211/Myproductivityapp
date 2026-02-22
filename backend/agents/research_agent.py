"""Income Research Agent — finds earning and learning opportunities."""

from services.llm_service import quick_llm_call
import json

SYSTEM_PROMPT = """You are a career and income strategy advisor. Based on the user's skills, goals, and interests, you provide actionable advice for:

1. **💰 Income Opportunities**: Freelance platforms, side projects, gig economy
2. **📚 Learning Paths**: Courses, certifications, skills to acquire
3. **🚀 Career Growth**: Steps to advance in current career
4. **💡 Side Project Ideas**: Specific project ideas that can generate income

Your advice should be:
- Specific and actionable (include platform names, course links, etc.)
- Tailored to the user's existing skills and goals
- Realistic and achievable
- Prioritized by potential impact

Format in clean markdown with sections, bullet points, and emojis.
Include estimated income ranges where applicable.
Keep the response focused and practical — around 400-600 words."""


async def research_income_opportunities(user_data: dict, user_prompt: str = "") -> str:
    """Research income and learning opportunities based on user profile."""
    data_summary = json.dumps(user_data, indent=2, default=str)
    
    user_message = f"""Based on this user's profile, suggest income and learning opportunities:

User Profile:
{data_summary}

{f"Specific question: {user_prompt}" if user_prompt else "Provide general recommendations based on their skills and interests."}

Focus on practical, actionable suggestions with specific platforms, tools, and estimated income potential."""
    
    return await quick_llm_call(SYSTEM_PROMPT, user_message, temperature=0.5)
