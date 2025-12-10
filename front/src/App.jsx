import { useState } from "react";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:4000/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      if (data.results && Array.isArray(data.results)) {
        setResults(data.results);
        setCount(data.count || 0);
      } else {
        setError(data.error || "Ошибка запроса");
        setResults([]);
        setCount(0);
      }
    } catch (e) {
      setError("Сеть недоступна или сервер не запущен");
      setResults([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <h1>Поиск через Яндекс API</h1>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Введите запрос..."
          style={{ padding: "8px", flex: 1 }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch} style={{ padding: "8px 12px" }}>
          Искать
        </button>
      </div>

      {loading && <p style={{ marginTop: 16 }}>Загрузка…</p>}
      {error && <p style={{ marginTop: 16, color: "tomato" }}>{error}</p>}

      {!loading && !error && results.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p>
            Найдено <strong>{count}</strong> результатов по запросу:{" "}
            <em>{query}</em>
          </p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {results.map((r, i) => (
              <li
                key={i}
                style={{
                  marginBottom: 16,
                  background: "#f7f7f7",
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                <a
                  href={r.link}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "none", color: "#1F59B0" }}
                >
                  <strong>{r.title || "Без названия"}</strong>
                </a>
                <p style={{ marginTop: 8, color: "#444" }}>
                  {r.snippet || "Без описания"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
