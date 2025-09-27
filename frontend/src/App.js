import React, { useState } from "react";

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
    <div
      style={{
        maxWidth: "700px",
        margin: "3rem auto",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
      }}
    >
      <h1 style={{ marginBottom: "2rem" }}>WikiChat</h1>

      <div style={{ display: "flex", gap: "0.5rem" }}>
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
          style={{
            flex: 1,
            padding: "1rem",
            fontSize: "1.1rem",
            borderRadius: "12px",
            border: "1px solid #ccc",
            outline: "none",
          }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            backgroundColor: loading ? "#6ba7ff" : "#007bff",
            color: "white",
            padding: "0 1.5rem",
            fontSize: "1.1rem",
            border: "none",
            borderRadius: "12px",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            transition: "background-color 0.3s ease",
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {result && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            border: "1px solid #ddd",
            borderRadius: "12px",
            textAlign: "left",
            backgroundColor: "#fafafa",
          }}
        >
          <p style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>
            {result.answer}
          </p>
          {result.source && (
            <p style={{ marginTop: "1rem" }}>
              <strong>Wikipedia Page: </strong>
              <a
                href={result.source}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#007bff", textDecoration: "none" }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.textDecoration = "underline")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.textDecoration = "none")
                }
              >
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
