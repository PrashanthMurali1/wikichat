import React, { useState } from "react";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("wikichat");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [wikiHistory, setWikiHistory] = useState([]);
  const [timelineHistory, setTimelineHistory] = useState([]);
  const [researchHistory, setResearchHistory] = useState([]);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);

    try {
      let endpoint;
      if (activeTab === "wikichat") {
        endpoint = `http://127.0.0.1:8000/chat?query=${encodeURIComponent(query)}`;
      } else if (activeTab === "timeline") {
        endpoint = `http://127.0.0.1:8000/timeline?query=${encodeURIComponent(query)}`;
      } else if (activeTab === "research") {
        endpoint = `http://127.0.0.1:8000/research?query=${encodeURIComponent(query)}`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();

      if (activeTab === "wikichat") {
        setWikiHistory((prev) => [{ query, result: data }, ...prev]);
      } else if (activeTab === "timeline") {
        setTimelineHistory((prev) => [{ query, result: data }, ...prev]);
      } else if (activeTab === "research") {
        setResearchHistory((prev) => [{ query, result: data }, ...prev]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  return (
    <div className="container">
      <h1>Wiki Explorer</h1>

      {/* Tabs */}
      <div className="tabs">
        <div
          className={`tab ${activeTab === "wikichat" ? "active" : ""}`}
          onClick={() => setActiveTab("wikichat")}
        >
          WikiChat
        </div>
        <div
          className={`tab ${activeTab === "timeline" ? "active" : ""}`}
          onClick={() => setActiveTab("timeline")}
        >
          Timeline Chat
        </div>
        <div
          className={`tab ${activeTab === "research" ? "active" : ""}`}
          onClick={() => setActiveTab("research")}
        >
          Research Chat
        </div>
      </div>

      {/* Search */}
      <div className="search-box">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={
            activeTab === "wikichat"
              ? "Ask me anything..."
              : activeTab === "timeline"
              ? "Ask for a historical timeline..."
              : "Ask a research question..."
          }
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className={
            activeTab === "wikichat"
              ? "blue"
              : activeTab === "timeline"
              ? "red"
              : "green"
          }
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* WikiChat results */}
      {activeTab === "wikichat" &&
        wikiHistory.map((item, idx) => (
          <div className="result-box" key={idx}>
            <p>
              <strong>You:</strong> {item.query}
            </p>
            <p>{item.result.answer}</p>
            {item.result.source && (
              <p>
                <strong>Wikipedia Page: </strong>
                <a href={item.result.source} target="_blank" rel="noreferrer">
                  {item.result.page_title || "View Page"}
                </a>
              </p>
            )}
          </div>
        ))}

      {/* Timeline results */}
      {activeTab === "timeline" &&
        timelineHistory.map((item, idx) => (
          <div key={idx} className="timeline">
            <p>
              <strong>You:</strong> {item.query}
            </p>
            {item.result.timeline &&
              item.result.timeline.map((event, i) => (
                <div className="timeline-item" key={i}>
                  <h3>{event.year}</h3>
                  <p>{event.event}</p>
                  {event.source && (
                    <p>
                      <a href={event.source} target="_blank" rel="noreferrer">
                        View Wikipedia Page
                      </a>
                    </p>
                  )}
                </div>
              ))}
          </div>
        ))}

      {/* Research results */}
      {activeTab === "research" &&
        researchHistory.map((item, idx) => (
          <div className="result-box" key={idx}>
            <p>
              <strong>You:</strong> {item.query}
            </p>
            <p>{item.result.answer}</p>
            {item.result.sources && (
              <p>
                <strong>Sources:</strong>{" "}
                {item.result.sources.map((src, i) => (
                  <span key={i}>
                    <a href="#" target="_blank" rel="noreferrer">
                      {src}
                    </a>
                    {i < item.result.sources.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            )}
          </div>
        ))}
    </div>
  );
}

export default App;
