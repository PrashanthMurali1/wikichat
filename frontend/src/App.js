import React, { useState } from "react";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("wikichat");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Separate history for each tab
  const [wikiHistory, setWikiHistory] = useState([]);
  const [timelineHistory, setTimelineHistory] = useState([]);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);

    try {
      let endpoint =
        activeTab === "wikichat"
          ? `http://127.0.0.1:8000/chat?query=${encodeURIComponent(query)}`
          : `http://127.0.0.1:8000/timeline?query=${encodeURIComponent(query)}`;

      const res = await fetch(endpoint);
      const data = await res.json();

      if (activeTab === "wikichat") {
        setWikiHistory((prev) => [...prev, { query, result: data }]);
      } else {
        setTimelineHistory((prev) => [...prev, { query, result: data }]);
      }
    } catch (err) {
      console.error(err);
      const errorData = { answer: "Error fetching answer" };
      if (activeTab === "wikichat") {
        setWikiHistory((prev) => [...prev, { query, result: errorData }]);
      } else {
        setTimelineHistory((prev) => [...prev, { query, result: errorData }]);
      }
    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  const renderWikiHistory = () => (
    <div>
      {wikiHistory.map((item, idx) => (
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
    </div>
  );

  const renderTimelineHistory = () => (
    <div className="timeline">
      {timelineHistory.map((item, idx) => (
        <div key={idx}>
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
    </div>
  );

  return (
    <div className="container">
      <h1>Wiki Explorer</h1>

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
      </div>

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
          placeholder={
            activeTab === "wikichat"
              ? "Ask me anything..."
              : "Ask for a historical timeline..."
          }
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className={activeTab === "wikichat" ? "blue" : "red"}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Render history based on active tab */}
      {activeTab === "wikichat" && renderWikiHistory()}
      {activeTab === "timeline" && renderTimelineHistory()}
    </div>
  );
}

export default App;
