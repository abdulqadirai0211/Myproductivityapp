"""Content Suggestion Agent — suggests daily post topics based on learnings, 
projects, and latest AI/Tech news via DuckDuckGo search."""

from services.llm_service import quick_llm_call
import json
import logging

logger = logging.getLogger("mytracker.agents.content")

SYSTEM_PROMPT = """You are a content strategy advisor specializing in AI/ML, Python, and tech content creation.

You help users decide what to post on LinkedIn, Medium, and social media (Reels/Shorts).

IMPORTANT FORMATTING RULES:
- Do NOT use markdown tables. They render poorly in the UI.
- Use headers (##, ###), bullet points, and bold text instead.
- Keep each suggestion concise — title, hook, and 3-4 bullet points max.
- Use emojis for visual breaks.

Structure your response EXACTLY like this:

## 📱 Today's Post Ideas

### 💼 LinkedIn Post #1
**Title:** [Specific title]
**Hook:** "[First 1-2 lines that grab attention]"
- Key point 1
- Key point 2
- Key point 3

### 💼 LinkedIn Post #2
**Title:** [Specific title]
**Hook:** "[First 1-2 lines]"
- Key point 1
- Key point 2

### ✍️ Medium Article
**Title:** "[Full article title]"
**Hook:** "[Opening paragraph hook]"
**Outline:**
1. Section 1 — brief description
2. Section 2 — brief description
3. Section 3 — brief description
**Target audience:** [who should read this]

### 🎬 Reel #1
**Hook (first 3s):** "[What you say/show]"
**Visual:** [What's on screen]
**Core message:** [1 line takeaway]

### 🎬 Reel #2
**Hook:** "[What you say/show]"
**Visual:** [What's on screen]
**Core message:** [1 line takeaway]

### 🎬 Reel #3
**Hook:** "[What you say/show]"
**Visual:** [What's on screen]
**Core message:** [1 line takeaway]

## 🔥 Trending Topics (from Latest News)

### 1. [Trend Name]
- **Why it matters:** [1 line]
- **Your angle:** [How user can tie their skills to this]

### 2. [Trend Name]
- **Why it matters:** [1 line]
- **Your angle:** [How to create content about this]

### 3. [Trend Name]
- **Why it matters:** [1 line]
- **Your angle:** [Specific content idea]

## 📅 Weekly Content Calendar

- **Monday:** 💼 LinkedIn — [topic]
- **Tuesday:** ✍️ Medium — [topic]
- **Wednesday:** 🎬 Reel — [topic]
- **Thursday:** 💼 LinkedIn — [topic]
- **Friday:** 🎬 Reel — [topic]

## 💡 Execution Tips
- Tip 1
- Tip 2
- Tip 3

Keep suggestions specific to the user's actual skills and learnings.
Reference trending news from the search results provided."""


async def _search_latest_news() -> str:
    """Search DuckDuckGo for latest AI/ML/Tech news."""
    logger.info("🔍 Starting DuckDuckGo search for latest AI/Tech news...")
    
    try:
        from duckduckgo_search import DDGS
        ddgs = DDGS()
        
        queries = [
            "latest AI news today 2026",
            "LangChain LangGraph Python new features 2026",
            "trending AI ML topics content creators",
        ]
        
        results = []
        for q in queries:
            try:
                logger.info(f"  🔎 Searching: '{q}'")
                search_results = ddgs.text(q, max_results=3)
                for r in search_results:
                    results.append(f"- **{r.get('title', '')}**: {r.get('body', '')} (Source: {r.get('href', '')})")
                logger.info(f"  ✅ Got {len(search_results)} results for '{q}'")
            except Exception as e:
                logger.warning(f"  ⚠️ Search failed for '{q}': {e}")
                continue
        
        if results:
            news = "\n".join(results)
            logger.info(f"📰 Total news items fetched: {len(results)}")
            return news
        else:
            logger.warning("⚠️ No search results returned from DuckDuckGo")
            return "No search results available."
            
    except ImportError:
        logger.error("❌ duckduckgo-search package not installed!")
        # Fallback to langchain community tool
        try:
            from langchain_community.tools import DuckDuckGoSearchRun
            search = DuckDuckGoSearchRun()
            logger.info("  Using langchain DuckDuckGoSearchRun fallback...")
            result = search.run("latest AI ML Python news 2026")
            logger.info(f"  ✅ Got fallback results")
            return result
        except Exception as e:
            logger.error(f"  ❌ Fallback also failed: {e}")
            return "Search unavailable."
    except Exception as e:
        logger.error(f"❌ DuckDuckGo search error: {e}")
        return f"Search failed: {str(e)}"


async def suggest_content(user_data: dict, user_prompt: str = "") -> str:
    """Suggest content topics based on user's profile, learnings, and latest AI/Tech news."""
    logger.info("🤖 Starting content suggestion generation...")
    
    data_summary = json.dumps(user_data, indent=2, default=str)
    logger.info(f"  📊 User data prepared ({len(data_summary)} chars)")
    
    # Search for latest news
    news = await _search_latest_news()
    logger.info(f"  📰 News data ready ({len(news)} chars)")
    
    user_message = f"""Based on this user's profile, current learnings, AND the latest AI/Tech news below, suggest content topics to post:

User Profile:
{data_summary}

The user posts on: LinkedIn, Medium, and creates Reels/Shorts about AI/ML, Python, LangChain, LangGraph, and tech topics.

--- LATEST AI/TECH NEWS (from DuckDuckGo search) ---
{news}
--- END NEWS ---

{f"Specific request: {user_prompt}" if user_prompt else "Suggest today's content ideas and a weekly calendar."}

Be specific — give actual post titles, hooks, and outlines. Focus on AI, Python, LangChain, LangGraph, and related technologies.
IMPORTANT: Reference at least 2-3 trending news items in your suggestions so the user can create timely, relevant content.
IMPORTANT: Do NOT use markdown tables. Use headers, bullet points, and bold text for readability."""
    
    logger.info("  🧠 Calling LLM for content suggestions...")
    result = await quick_llm_call(SYSTEM_PROMPT, user_message, temperature=0.6)
    logger.info(f"  ✅ Content suggestions generated ({len(result)} chars)")
    
    return result
