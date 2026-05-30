import { useState, useEffect } from "react"
import AgentForm from "./components/AgentForm"
import AgentLogs from "./components/AgentLogs"
import ResultPanel from "./components/ResultPanel"
import SessionHistory from "./components/SessionHistory"

const WS_URL = "ws://localhost:8000/ws/fix"
const API_URL = "http://localhost:8000"

export default function App() {
  const [phase, setPhase] = useState("idle") // idle | running | done | error
  const [logs, setLogs] = useState([])
  const [result, setResult] = useState(null)
  const [sessions, setSessions] = useState([])
  const [activeTab, setActiveTab] = useState("agent") // agent | history

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/sessions`)
      const data = await res.json()
      setSessions(data)
    } catch (e) {
      console.log("Could not fetch sessions")
    }
  }

  const handleSubmit = ({ repoUrl, bugDescription }) => {
    setLogs([])
    setResult(null)
    setPhase("running")

    const ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      ws.send(JSON.stringify({
        repo_url: repoUrl,
        bug_description: bugDescription
      }))
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)

      if (msg.type === "log") {
        setLogs(prev => [...prev, { text: msg.message, time: new Date().toLocaleTimeString() }])
      } else if (msg.type === "result") {
        setResult(msg.data)
        setPhase(msg.data.success ? "done" : "error")
        fetchSessions()
      } else if (msg.type === "error") {
        setLogs(prev => [...prev, { text: `❌ ${msg.message}`, time: new Date().toLocaleTimeString() }])
        setPhase("error")
      }
    }

    ws.onerror = () => {
      setLogs(prev => [...prev, { text: "❌ WebSocket connection failed. Is the backend running?", time: new Date().toLocaleTimeString() }])
      setPhase("error")
    }
  }

  const handleReset = () => {
    setPhase("idle")
    setLogs([])
    setResult(null)
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        padding: "20px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--bg2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: 36, height: 36,
            background: "var(--accent)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px"
          }}>🤖</div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "18px", color: "var(--accent)", letterSpacing: "-0.5px" }}>
              BugFixAgent
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Autonomous Code Repair System
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {["agent", "history"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: activeTab === tab ? "var(--accent)" : "var(--border)",
                background: activeTab === tab ? "rgba(0,255,136,0.1)" : "transparent",
                color: activeTab === tab ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                textTransform: "capitalize",
                transition: "all 0.2s"
              }}
            >
              {tab === "agent" ? "🤖 Agent" : `📋 History (${sessions.length})`}
            </button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
        {activeTab === "agent" ? (
          <div style={{ display: "grid", gridTemplateColumns: phase === "idle" ? "1fr" : "1fr 1fr", gap: "24px", transition: "all 0.3s" }}>
            {/* Left panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <AgentForm onSubmit={handleSubmit} isRunning={phase === "running"} onReset={handleReset} phase={phase} />
              {logs.length > 0 && <AgentLogs logs={logs} isRunning={phase === "running"} />}
            </div>

            {/* Right panel — result */}
            {result && (
              <ResultPanel result={result} />
            )}
          </div>
        ) : (
          <SessionHistory sessions={sessions} />
        )}
      </main>
    </div>
  )
}