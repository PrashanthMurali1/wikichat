import React, { useState } from "react";

function App() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setAnswer(null);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/smartqa?query=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setAnswer(data);
    } catch (err) {
      console.error(err);
      setAnswer({ summary: "Error fetching answer", source: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", fontFamily: "Arial" }}>
      <h1>WikiChat</h1>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask me anything..."
          style={{ flex: 1, padding: "0.5rem" }}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {answer && (
        <div style={{ marginTop: "1.5rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "8px" }}>
          <p>{answer.summary}</p>
          {answer.source && (
            <p>
              <a href={answer.source} target="_blank" rel="noreferrer">
                View Wikipedia Page
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
