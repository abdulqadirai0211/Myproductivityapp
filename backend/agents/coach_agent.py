"""AI Weekly Coach — reviews the week and creates next week's action plan."""

from services.llm_service import quick_llm_call
import json
import logging

logger = logging.getLogger("mytracker.agents.coach")

SYSTEM_PROMPT = """You are an elite productivity coach and personal advisor. Your name is CoachAI.

You review the user's entire week — their habits, tasks, goals, income, standups, and content creation — 
and provide a brutally honest but encouraging weekly review + next week's action plan.

Structure your response EXACTLY like this:

## 🏆 Weekly Scorecard
Give an overall grade (A+ to F) and one-line summary.

## ✅ Wins This Week
- List 3-5 specific wins (habits maintained, tasks completed, content posted)

## ⚠️ Missed Opportunities
- What they planned but didn't do
- Habits broken, tasks skipped

## 📊 Key Metrics
- Habit consistency: X%
- Tasks completed: X/Y
- Content posted: X pieces
- Focus score avg: X/10

## 🎯 Next Week's Action Plan

### Monday
- [ ] Specific task 1
- [ ] Specific task 2

### Tuesday
- [ ] Specific task 1
- [ ] Specific task 2

(Continue through Friday)

## 💪 Coach's Message
A 2-3 sentence personal motivational message based on their actual data. Be specific, not generic.
Reference their actual numbers and trends.

Keep it concise, actionable, and data-driven. No fluff."""


async def generate_weekly_coaching(user_data: dict, user_prompt: str = "") -> str:
    """Generate a weekly coaching review and plan."""
    logger.info("🏋️ Generating weekly coaching review...")
    data_summary = json.dumps(user_data, indent=2, default=str)
    
    user_message = f"""Review this user's week and create a coaching plan:

{data_summary}

{f"User's additional context: {user_prompt}" if user_prompt else ""}

Be specific with their data. Reference actual habit names, task titles, and numbers.
Create a realistic next-week plan based on their patterns."""
    
    result = await quick_llm_call(SYSTEM_PROMPT, user_message, temperature=0.4)
    logger.info(f"  ✅ Coaching review generated ({len(result)} chars)")
    return result
