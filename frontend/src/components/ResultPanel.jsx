import { useState } from "react"

export default function ResultPanel({ result }) {
  const [activeTab, setActiveTab] = useState("explanation")

  if (!result) return null

  const tabs = [
    { id: "explanation", label: "🔍 Analysis" },
    { id: "fix", label: "🔧 Fixed Code" },
    result.pr_url && { id: "pr", label: "📬 Pull Request" }
  ].filter(Boolean)

  return (
    <div style={{
      background: "var(--bg2)",
      border: `1px solid ${result.success ? "var(--accent)" : "var(--accent3)"}`,
      borderRadius: "12px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Result header */}
      <div style={{
        padding: "20px 24px",
        background: result.success ? "rgba(0,255,136,0.06)" : "rgba(255,107,107,0.06)",
        borderBottom: "1px solid var(--border)"
      }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "18px",
          color: result.success ? "var(--accent)" : "var(--accent3)",
          marginBottom: "4px"
        }}>
          {result.success ? "✅ Bug Fixed Successfully" : "❌ Fix Failed"}
        </div>
        {result.fixed_file && (
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            📄 {result.fixed_file}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg3)"
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 16px",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid var(--accent)" : "2px solid transparent",
              background: "transparent",
              color: activeTab === tab.id ? "var(--accent)" : "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto", maxHeight: "500px" }}>
        {activeTab === "explanation" && (
          <div>
            <div style={{ fontSize: "11px", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
              Bug Analysis
            </div>
            <pre style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              lineHeight: "1.7",
              color: "var(--text)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }}>
              {result.bug_analysis || "No analysis available"}
            </pre>

            {result.fix_explanation && (
              <>
                <div style={{ fontSize: "11px", color: "var(--accent2)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", marginTop: "24px" }}>
                  Fix Explanation
                </div>
                <pre style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  lineHeight: "1.7",
                  color: "var(--text)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word"
                }}>
                  {result.fix_explanation}
                </pre>
              </>
            )}
          </div>
        )}

        {activeTab === "fix" && (
          <div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px"
            }}>
              <div style={{ fontSize: "11px", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px" }}>
                Fixed Code
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(result.fixed_code || "")}
                style={{
                  padding: "4px 10px",
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  cursor: "pointer"
                }}
              >
                Copy
              </button>
            </div>
            <pre style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "16px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              lineHeight: "1.6",
              color: "var(--text)",
              overflowX: "auto",
              whiteSpace: "pre"
            }}>
              {result.fixed_code || "No fixed code available"}
            </pre>
          </div>
        )}

        {activeTab === "pr" && result.pr_url && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
            <div style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "20px",
              color: "var(--accent)",
              marginBottom: "8px"
            }}>
              Pull Request Created!
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "24px" }}>
              The agent has opened a PR with the fix
            </div>
            <a
              href={result.pr_url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                background: "var(--accent)",
                color: "var(--bg)",
                borderRadius: "8px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "13px",
                textDecoration: "none"
              }}
            >
              View Pull Request →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}