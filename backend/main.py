from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import google.generativeai as genai
import os
import requests

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Clients
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Wikipedia APIs
WIKI_API = "https://en.wikipedia.org/w/api.php"
WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/"

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)  # empty response, no content


@app.get("/chat")
def qa(query: str, engine: str = "gemini"):
    """
    Unified QA endpoint.
    - engine=groq   → Llama via Groq (fast, summary-only)
    - engine=gemini → Gemini 2.5 Flash (rich answer + wiki page)
    """
    headers = {"User-Agent": "WikiChatApp/0.1"}

    if engine == "groq":
        # Step 1: Ask Groq which page to fetch
        prompt = f"""
        The user asked: "{query}"

        Respond ONLY with the exact title of the single Wikipedia page that best answers this.
        Do not explain. Do not add text. Just the page title.
        """

        routing_resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}]
        )

        page_title = routing_resp.choices[0].message.content.strip()
        page_url = f"https://en.wikipedia.org/wiki/{page_title.replace(' ', '_')}"

        # Step 2: Fetch Wikipedia summary
        extract_url = WIKI_SUMMARY + page_title
        extract = requests.get(extract_url, headers=headers).json()
        summary = extract.get("extract", "No summary available.")

        return {
            "answer": summary,
            "page_title": page_title,
            "source": page_url
        }

    elif engine == "gemini":
        # Step 1: Ask Gemini for both answer + page title
        prompt = f"""
        The user asked: "{query}"

        Your job:
        1. Answer the question clearly in a paragraph or two.
        2. On a new line, respond with the EXACT Wikipedia page title that best matches the answer.

        Format strictly like this:
        ANSWER: <your answer>
        PAGE: <Wikipedia page title>
        """

        model = genai.GenerativeModel("models/gemini-2.5-flash")
        resp = model.generate_content(prompt)

        content = resp.text.strip()
        answer, page_title = None, None

        for line in content.splitlines():
            if line.startswith("ANSWER:"):
                answer = line.replace("ANSWER:", "").strip()
            elif line.startswith("PAGE:"):
                page_title = line.replace("PAGE:", "").strip()

        if not page_title:
            return {"error": "Gemini did not return a Wikipedia page title"}

        page_url = f"https://en.wikipedia.org/wiki/{page_title.replace(' ', '_')}"

        return {
            "answer": answer,
            "page_title": page_title,
            "source": page_url
        }

    else:
        return {"error": f"Unsupported engine '{engine}'. Use 'groq' or 'gemini'."}
