export default function SessionHistory({ sessions }) {
  if (sessions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>📋</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "18px", marginBottom: "8px" }}>No sessions yet</div>
        <div style={{ fontSize: "13px" }}>Run the agent to see history here</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: "20px",
        marginBottom: "24px",
        color: "var(--text)"
      }}>
        Fix History
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {sessions.map((session, i) => (
          <div
            key={i}
            style={{
              background: "var(--bg2)",
              border: `1px solid ${session.success ? "rgba(0,255,136,0.2)" : "rgba(255,107,107,0.2)"}`,
              borderRadius: "10px",
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px"
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span>{session.success ? "✅" : "❌"}</span>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  color: "var(--accent2)"
                }}>
                  {session.repo_url}
                </span>
              </div>
              <div style={{ fontSize: "13px", color: "var(--text)", marginBottom: "8px" }}>
                {session.bug_description}
              </div>
              {session.result?.fixed_file && (
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Fixed: {session.result.fixed_file}
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {session.created_at ? new Date(session.created_at).toLocaleDateString() : ""}
              </div>
              {session.result?.pr_url && (
                <a
                  href={session.result.pr_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: "11px",
                    color: "var(--accent)",
                    textDecoration: "none",
                    border: "1px solid var(--accent)",
                    padding: "3px 8px",
                    borderRadius: "4px"
                  }}
                >
                  View PR →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}