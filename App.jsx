import { useState } from "react";
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      setSummary(data.summary || "Error: " + data.error);
    } catch (error) {
      setSummary("Error: Unable to fetch summary");
    }
    setLoading(false);
  };

  return (
    <div className="app">
      <h1>News Summarizer</h1>
      <div className="input-section">
        <input
          type="text"
          placeholder="Enter news article URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button onClick={handleSummarize} disabled={loading}>
          {loading ? "Summarizing..." : "Summarize"}
        </button>
      </div>
      {summary && (
        <div className="summary-section">
          <h2>Summary</h2>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
}

export default App;
