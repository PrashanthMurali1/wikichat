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
        model="llama-3.1-8b-instant",   # or llama-3.1-8b-instant for cheaper/faster
        messages=[{"role": "user", "content": prompt}]
    )

    return {"answer": resp.choices[0].message.content}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)  # empty response, no content