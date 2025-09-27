from fastapi import FastAPI
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
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

WIKI_API = "https://en.wikipedia.org/w/api.php"
WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/"

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def search_wikipedia(query: str):
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "utf8": 1,
        "format": "json"
    }
    headers = {"User-Agent": "WikiChatApp/0.1 (https://github.com/yourusername/wikichat)"}
    res = requests.get(WIKI_API, params=params, headers=headers)
    res.raise_for_status()   # raise error if not 200
    print(res.status_code, res.text)
    data = res.json()

    if not data["query"]["search"]:
        return "No results found.", None

    top = data["query"]["search"][0]
    title = top["title"]
    page_url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"

    extract_res = requests.get(WIKI_SUMMARY + title, headers=headers)
    extract_res.raise_for_status()
    extract = extract_res.json()

    return extract.get("extract", "No summary available."), page_url

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)  # empty response, no content

@app.get("/smartqa")
def smart_qa(query: str):
    headers = {"User-Agent": "WikiChatApp/0.1"}

    # Step 1: Ask LLM which Wikipedia page to fetch
    prompt = f"""
    The user asked: "{query}"

    Your job: Respond ONLY with the exact title of the single Wikipedia page that best answers this question.
    Do not explain. Do not add text. Just give the title.
    """

    routing_resp = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}]
    )

    page_title = routing_resp.choices[0].message.content.strip()
    page_url = f"https://en.wikipedia.org/wiki/{page_title.replace(' ', '_')}"

    # Step 2: Fetch Wikipedia summary for that title
    extract_url = WIKI_SUMMARY + page_title
    extract = requests.get(extract_url, headers=headers).json()
    summary = extract.get("extract", "No summary available.")

    # Step 3: Return answer + link
    return {
        "summary": summary,
        "source": page_url
    }

@app.get("/chat")
def chat(query: str):
    # Step 1: Ask Gemini to answer + provide page title
    prompt = f"""
    The user asked: "{query}"

    Your job:
    1. Answer the question clearly in a paragraph or two. 
    3. On a new line, respond with the EXACT Wikipedia page title that best matches the answer.

    Format strictly like this:
    ANSWER: <your answer>
    PAGE: <Wikipedia page title>
    """

    model = genai.GenerativeModel("gemini-2.5-flash")
    resp = model.generate_content(prompt)

    content = resp.text.strip()

    # Step 2: Parse LLM response
    answer = None
    page_title = None
    for line in content.splitlines():
        if line.startswith("ANSWER:"):
            answer = line.replace("ANSWER:", "").strip()
        elif line.startswith("PAGE:"):
            page_title = line.replace("PAGE:", "").strip()

    if not page_title:
        return {"error": "Gemini did not return a Wikipedia page title"}

    # Step 3: Build Wikipedia link
    page_url = f"https://en.wikipedia.org/wiki/{page_title.replace(' ', '_')}"

    return {
        "answer": answer,
        "page_title": page_title,
        "source": page_url
    }
