# ingest.py
import os
import pickle
import faiss
import fitz  # PyMuPDF
from sentence_transformers import SentenceTransformer

DATA_DIR = "data/papers"
INDEX_FILE = "vector.index"
META_FILE = "metadata.pkl"

# Embedding model (local + free)
embedder = SentenceTransformer("all-MiniLM-L6-v2", cache_folder="./models")

def load_pdfs(folder):
    docs = []
    for file in os.listdir(folder):
        if file.endswith(".pdf"):
            path = os.path.join(folder, file)
            doc = fitz.open(path)
            text = ""
            for page in doc:
                text += page.get_text()
            docs.append((file, text))
    return docs

def chunk_text(text, size=500, overlap=50):
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start += size - overlap
    return chunks

def build_index():
    docs = load_pdfs(DATA_DIR)
    texts, meta = [], []

    for file, text in docs:
        for chunk in chunk_text(text):
            texts.append(chunk)
            meta.append({"source": file, "text": chunk})

    embeddings = embedder.encode(texts, show_progress_bar=True)

    # Build FAISS index
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    faiss.write_index(index, INDEX_FILE)
    with open(META_FILE, "wb") as f:
        pickle.dump(meta, f)

    print(f"✅ Indexed {len(texts)} chunks from {len(docs)} papers.")

if __name__ == "__main__":
    build_index()
