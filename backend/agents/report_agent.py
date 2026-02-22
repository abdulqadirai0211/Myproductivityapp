"""Weekly Report Generator Agent — creates comprehensive weekly reports."""

from services.llm_service import quick_llm_call
import json

SYSTEM_PROMPT = """You are a productivity report generator. You create clear, motivating, and insightful weekly reports.

Your report should be in markdown format and include:

# 📊 Weekly Productivity Report

## 📅 Week Overview
- Date range, total tasks, completion rate

## ✅ Achievements
- List of completed tasks with brief impact notes

## ⏳ Pending / Missed
- Tasks that weren't completed — why they might have been missed

## 🎯 Goal Progress
- Progress on each active goal with percentage

## 📈 Productivity Trends
- Mood and energy patterns
- Best and worst days
- Focus hours summary

## 💡 Key Insights
- 2-3 data-driven observations

## 🚀 Next Week Recommendations
- 3-5 actionable suggestions for improvement
- Suggested priorities for next week

## 🏆 Weekly Score
- Give an overall score out of 10 with justification

Be encouraging, use data, keep it concise but comprehensive. Use emojis for visual appeal."""


async def generate_weekly_report(data: dict) -> str:
    """Generate a weekly productivity report."""
    data_summary = json.dumps(data, indent=2, default=str)
    
    user_message = f"""Generate a weekly productivity report from this data:

{data_summary}

Create a comprehensive, motivating report with actionable insights."""
    
    return await quick_llm_call(SYSTEM_PROMPT, user_message, temperature=0.4)
