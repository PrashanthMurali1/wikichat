import React, { useState } from "react";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/chat?query=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ answer: "Error fetching answer", source: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>WikiChat</h1>

      <div className="search-box">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          placeholder="Ask me anything..."
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {result && (
        <div className="result-box">
          <p>{result.answer}</p>
          {result.source && (
            <p>
              <strong>Wikipedia Page: </strong>
              <a href={result.source} target="_blank" rel="noreferrer">
                {result.page_title || "View Page"}
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
