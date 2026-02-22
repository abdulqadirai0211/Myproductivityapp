"""Task Prioritizer Agent — uses Eisenhower Matrix to prioritize and suggest what to ignore."""

from services.llm_service import quick_llm_call
import json

SYSTEM_PROMPT = """You are an expert task prioritization consultant using the Eisenhower Decision Matrix.

For each task, you must classify it into one of four quadrants:
1. **🔴 DO FIRST** (Urgent + Important): Critical deadlines, emergencies
2. **🟡 SCHEDULE** (Not Urgent + Important): Long-term goals, learning, growth
3. **🟠 DELEGATE** (Urgent + Not Important): Interruptions, some meetings
4. **🟢 ELIMINATE** (Not Urgent + Not Important): Time-wasters, can be ignored

Your response MUST include:
1. A prioritized list of tasks organized by quadrant
2. For each task: brief justification for the classification
3. **TASKS TO IGNORE**: Explicitly list tasks that can be safely skipped or eliminated
4. **FOCUS ORDER**: Top 3 tasks to do RIGHT NOW
5. A brief time management tip

Format in clean markdown. Be decisive — don't say "it depends".
Respond with a JSON block at the end containing task IDs and their assigned quadrants:
```json
{"priorities": [{"id": <task_id>, "quadrant": "<quadrant_value>", "rank": <1-N>}]}
```"""


async def prioritize_tasks(tasks: list, user_prompt: str = "") -> str:
    """Prioritize tasks using Eisenhower Matrix."""
    if not tasks:
        return "## No Pending Tasks 🎉\n\nYou have no pending tasks! Consider adding new tasks aligned with your goals."
    
    task_data = json.dumps(tasks, indent=2, default=str)
    
    user_message = f"""Here are the pending tasks to prioritize:

{task_data}

Today's date: Use the due dates to assess urgency.

{f"User context: {user_prompt}" if user_prompt else ""}

Classify each task into Eisenhower quadrants and provide a clear action plan."""
    
    return await quick_llm_call(SYSTEM_PROMPT, user_message, temperature=0.2)
