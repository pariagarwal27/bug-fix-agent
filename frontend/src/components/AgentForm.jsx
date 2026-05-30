import { useState } from "react"

export default function AgentForm({ onSubmit, isRunning, onReset, phase }) {
  const [repoUrl, setRepoUrl] = useState("")
  const [bugDescription, setBugDescription] = useState("")

  const handleSubmit = () => {
    if (!repoUrl.trim() || !bugDescription.trim()) return
    onSubmit({ repoUrl, bugDescription })
  }

  const inputStyle = {
    width: "100%",
    background: "var(--bg3)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "12px 16px",
    color: "var(--text)",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    outline: "none",
    transition: "border-color 0.2s"
  }

  return (
    <div style={{
      background: "var(--bg2)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      padding: "28px",
    }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "20px",
          color: "var(--text)",
          marginBottom: "6px"
        }}>
          Fix a Bug Autonomously
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Paste a GitHub repo and describe the bug — the agent handles the rest
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ fontSize: "11px", color: "var(--accent)", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
            GitHub Repository URL
          </label>
          <input
            style={inputStyle}
            placeholder="https://github.com/username/repository"
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            disabled={isRunning}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        <div>
          <label style={{ fontSize: "11px", color: "var(--accent)", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
            Bug Description
          </label>
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: "100px", lineHeight: "1.6" }}
            placeholder="Describe the bug in detail. e.g. 'The login function throws a null pointer exception when email is empty'"
            value={bugDescription}
            onChange={e => setBugDescription(e.target.value)}
            disabled={isRunning}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {phase === "idle" || phase === "done" || phase === "error" ? (
            <>
              <button
                onClick={handleSubmit}
                disabled={!repoUrl.trim() || !bugDescription.trim()}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: (!repoUrl.trim() || !bugDescription.trim()) ? "var(--border)" : "var(--accent)",
                  color: (!repoUrl.trim() || !bugDescription.trim()) ? "var(--text-muted)" : "var(--bg)",
                  border: "none",
                  borderRadius: "8px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: (!repoUrl.trim() || !bugDescription.trim()) ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  letterSpacing: "0.5px"
                }}
              >
                🚀 Run Agent
              </button>
              {(phase === "done" || phase === "error") && (
                <button
                  onClick={onReset}
                  style={{
                    padding: "14px 20px",
                    background: "transparent",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  Reset
                </button>
              )}
            </>
          ) : (
            <div style={{
              flex: 1,
              padding: "14px",
              background: "rgba(0,255,136,0.08)",
              border: "1px solid var(--accent)",
              borderRadius: "8px",
              textAlign: "center",
              fontSize: "13px",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px"
            }}>
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span>
              Agent is working...
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}