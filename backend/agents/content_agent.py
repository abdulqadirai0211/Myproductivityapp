"""Content Suggestion Agent — suggests daily post topics based on learnings, 
projects, and latest AI/Tech news from DuckDuckGo search."""

from services.llm_service import quick_llm_call
import json
import os

SYSTEM_PROMPT = """You are a content strategy advisor specializing in AI/ML, Python, and tech content creation.

You help users decide what to post on LinkedIn, Medium, and social media (Reels/Shorts).

Based on the user's learnings, projects, interests, AND the latest AI/Tech news, suggest:

## 📱 Today's Post Ideas

### LinkedIn (1-2 ideas)
- Professional insights, learnings, project updates
- Include a hook line and key talking points

### Medium / Blog (1 idea)  
- In-depth technical article idea
- Include title, outline, and target audience

### Reels / Shorts (2-3 ideas)
- Quick tips, code snippets, tool demos
- Include the visual concept and hook

## 🔥 Trending Topics (Based on Latest News)
- What's hot in AI/ML right now that the user should create content about
- Specific tools, frameworks, papers, launches, or news
- How the user can relate their learnings to these trends

## 📅 Weekly Content Calendar
- Suggest a simple Mon-Fri content schedule

Format in clean markdown. Be specific with titles and hooks — not generic.
Keep suggestions relevant to the user's actual skills and learnings.
Reference any trending news items you received."""


async def _search_latest_news() -> str:
    """Search DuckDuckGo for latest AI/ML/Tech news."""
    try:
        from langchain_community.tools import DuckDuckGoSearchRun
        search = DuckDuckGoSearchRun()
        
        queries = [
            "latest AI news today 2026",
            "Python LangChain LangGraph new features",
            "trending tech topics for content creators",
        ]
        
        results = []
        for q in queries:
            try:
                result = search.run(q)
                results.append(f"### Search: {q}\n{result}\n")
            except Exception:
                continue
        
        return "\n".join(results) if results else "No search results available."
    except ImportError:
        return "DuckDuckGo search not available (install duckduckgo-search package)."
    except Exception as e:
        return f"Search failed: {str(e)}"


async def suggest_content(user_data: dict, user_prompt: str = "") -> str:
    """Suggest content topics based on user's profile, learnings, and latest AI/Tech news."""
    data_summary = json.dumps(user_data, indent=2, default=str)
    
    # Search for latest news
    news = await _search_latest_news()
    
    user_message = f"""Based on this user's profile, current learnings, AND the latest AI/Tech news below, suggest content topics to post:

User Profile:
{data_summary}

The user posts on: LinkedIn, Medium, and creates Reels/Shorts about AI/ML, Python, LangChain, LangGraph, and tech topics.

--- LATEST AI/TECH NEWS (from web search) ---
{news}
--- END NEWS ---

{f"Specific request: {user_prompt}" if user_prompt else "Suggest today's content ideas and a weekly calendar."}

Be specific — give actual post titles, hooks, and outlines. Focus on AI, Python, LangChain, LangGraph, and related technologies.
IMPORTANT: Reference at least 2-3 trending news items in your suggestions so the user can create timely, relevant content."""
    
    return await quick_llm_call(SYSTEM_PROMPT, user_message, temperature=0.6)
