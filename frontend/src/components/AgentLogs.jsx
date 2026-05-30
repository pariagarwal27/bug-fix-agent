import { useEffect, useRef } from "react"

export default function AgentLogs({ logs, isRunning }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  return (
    <div style={{
      background: "var(--bg)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      overflow: "hidden"
    }}>
      {/* Terminal header */}
      <div style={{
        background: "var(--bg3)",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        borderBottom: "1px solid var(--border)"
      }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px", fontFamily: "var(--font-mono)" }}>
          agent.log
        </span>
        {isRunning && (
          <span style={{
            marginLeft: "auto",
            fontSize: "10px",
            color: "var(--accent)",
            animation: "pulse 1.5s ease-in-out infinite"
          }}>
            ● LIVE
          </span>
        )}
      </div>

      {/* Log output */}
      <div style={{
        padding: "16px",
        maxHeight: "300px",
        overflowY: "auto",
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        lineHeight: "1.8"
      }}>
        {logs.map((log, i) => (
          <div key={i} style={{
            display: "flex",
            gap: "12px",
            opacity: i === logs.length - 1 ? 1 : 0.7,
            transition: "opacity 0.3s"
          }}>
            <span style={{ color: "var(--text-muted)", flexShrink: 0, fontSize: "10px", paddingTop: "2px" }}>
              {log.time}
            </span>
            <span style={{
              color: log.text.includes("❌") ? "var(--accent3)"
                : log.text.includes("✅") ? "var(--accent)"
                : log.text.includes("🎉") ? "#ffd700"
                : "var(--text)"
            }}>
              {log.text}
            </span>
          </div>
        ))}
        {isRunning && (
          <div style={{ color: "var(--accent)", marginTop: "4px" }}>
            <span style={{ animation: "blink 1s step-end infinite" }}>█</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  )
}