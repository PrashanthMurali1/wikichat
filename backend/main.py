from fastapi import FastAPI
import requests
from groq import Groq
import os

app = FastAPI()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

WIKI_API = "https://en.wikipedia.org/w/api.php"
WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/"

def search_wikipedia(query: str):
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "utf8": "",
        "format": "json"
    }
    res = requests.get(WIKI_API, params=params).json()
    top = res["query"]["search"][0]
    title = top["title"]
    page_url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
    extract = requests.get(WIKI_SUMMARY + title).json()
    return extract.get("extract", ""), page_url

@app.get("/chat")
def chat(query: str):
    content, link = search_wikipedia(query)
    prompt = f"""
    You are a helpful assistant. Answer the question based ONLY on the following Wikipedia content.
    If not enough info is found, say so. Always provide the page link at the end.

    Wikipedia Content:
    {content}

    Question: {query}
    """

    resp = client.chat.completions.create(
        model="llama-3.1-70b-versatile",   # or llama-3.1-8b-instant for cheaper/faster
        messages=[{"role": "user", "content": prompt}]
    )

    return {"answer": resp.choices[0].message.content}
