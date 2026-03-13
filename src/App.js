import { useState } from "react";

/* ── Constants ─────────────────────────────────────────────────── */
const USD_TO_INR = 92.35;
const fmt = (v) => "₹" + Math.round(v).toLocaleString("en-IN");

/* ── Data ──────────────────────────────────────────────────────── */
const PROVIDERS = [
  {
    id: "aws", name: "AWS", label: "Amazon Web Services",
    color: "#ff9900", region: "ap-south-1",
    costs: { CPU: 112, GPU: 340, RAM: 78, Storage: 45, Network: 92, Cloud: 130 },
  },
  {
    id: "azure", name: "Azure", label: "Microsoft Azure",
    color: "#0078d4", region: "centralindia",
    costs: { CPU: 88, GPU: 270, RAM: 62, Storage: 38, Network: 74, Cloud: 105 },
  },
  {
    id: "gcp", name: "GCP", label: "Google Cloud",
    color: "#4285f4", region: "asia-south1",
    costs: { CPU: 76, GPU: 240, RAM: 55, Storage: 33, Network: 65, Cloud: 95 },
  },
];

PROVIDERS.forEach((p) => {
  const inrCosts = {};
  Object.entries(p.costs).forEach(([k, v]) => { inrCosts[k] = Math.round(v * USD_TO_INR); });
  p.costsINR = inrCosts;
  p.total = Object.values(inrCosts).reduce((s, v) => s + v, 0);
});

const RESOURCES = Object.keys(PROVIDERS[0].costs);
const MAX_COST  = Math.max(...PROVIDERS.flatMap((p) => Object.values(p.costsINR)));
const CHEAPEST  = PROVIDERS.reduce((a, b) => a.total < b.total ? a : b);
const SAVINGS   = Math.max(...PROVIDERS.map((p) => p.total)) - Math.min(...PROVIDERS.map((p) => p.total));

/* ── Icons ─────────────────────────────────────────────────────── */
function AWSLogo() {
  return (
    <svg width="52" height="32" viewBox="0 0 80 50" fill="none">
      <text x="0" y="36" fontFamily="Arial Black" fontSize="34" fontWeight="900" fill="#ff9900">aws</text>
      <path d="M4 43 Q40 55 76 43" stroke="#ff9900" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M70 38 L76 43 L68 46" stroke="#ff9900" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function AzureLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 50 50" fill="none">
      <path d="M5 42 L22 8 L35 28 L20 28 Z" fill="#0078d4"/>
      <path d="M22 8 L42 42 L28 42 L35 28 Z" fill="#50abf1"/>
      <path d="M5 42 L20 28 L28 42 Z"        fill="#005ba1"/>
    </svg>
  );
}

function GCPLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 50 50" fill="none">
      <circle cx="25" cy="25" r="20" fill="none" stroke="#e8e8e8" strokeWidth="4"/>
      <path d="M25 8 A17 17 0 0 1 42 25"  stroke="#4285f4" strokeWidth="5" strokeLinecap="round"/>
      <path d="M42 25 A17 17 0 0 1 25 42" stroke="#ea4335" strokeWidth="5" strokeLinecap="round"/>
      <path d="M25 42 A17 17 0 0 1 8 25"  stroke="#fbbc04" strokeWidth="5" strokeLinecap="round"/>
      <path d="M8 25 A17 17 0 0 1 25 8"   stroke="#34a853" strokeWidth="5" strokeLinecap="round"/>
      <circle cx="25" cy="25" r="8" fill="white"/>
      <circle cx="25" cy="25" r="5" fill="#4285f4"/>
    </svg>
  );
}

const LOGOS = { aws: AWSLogo, azure: AzureLogo, gcp: GCPLogo };

/* ── App ────────────────────────────────────────────────────────── */
export default function App() {
  const [active, setActive] = useState("aws");
  const provider = PROVIDERS.find((p) => p.id === active);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0c10", color: "#f0f2f7", fontFamily: "'DM Sans', system-ui, sans-serif", padding: "48px 24px" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", fontSize: 11, color: "rgba(240,242,247,0.5)", fontFamily: "monospace", marginBottom: 20 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }}/>
          ATOMITY · CLOUD COST INTELLIGENCE
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 12px" }}>
          See where your cloud budget<br/>
          <span style={{ color: "#4ade80" }}>actually goes.</span>
        </h1>
        <p style={{ color: "rgba(240,242,247,0.5)", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
          Compare spend across AWS, Azure, and GCP in one place.
        </p>
        <div style={{ marginTop: 8, fontSize: 11, color: "rgba(240,242,247,0.3)", fontFamily: "monospace" }}>
          1 USD = ₹83.5 · All prices in INR
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Provider selector */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {PROVIDERS.map((p) => {
            const Logo = LOGOS[p.id];
            const selected = active === p.id;
            return (
              <button key={p.id} onClick={() => setActive(p.id)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <div style={{
                  width: 100, height: 100, borderRadius: 20,
                  background: selected ? `${p.color}18` : "#111318",
                  border: `2px solid ${selected ? p.color : "rgba(255,255,255,0.07)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 200ms",
                  boxShadow: selected ? `0 0 20px ${p.color}30` : "none",
                }}>
                  <Logo/>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f2f7" }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: "rgba(240,242,247,0.4)", fontFamily: "monospace" }}>{p.region}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bar chart */}
        <div style={{ background: "#111318", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 20, padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,242,247,0.5)", marginBottom: 16 }}>
            {provider.label} — Resource Breakdown
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 140 }}>
            {RESOURCES.map((res) => {
              const cost = provider.costsINR[res];
              const pct  = (cost / MAX_COST) * 100;
              return (
                <div key={res} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
                  <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(240,242,247,0.5)" }}>{fmt(cost)}</div>
                  <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                    <div style={{
                      width: "100%", height: `${pct}%`, borderRadius: 6,
                      background: `linear-gradient(to top, ${provider.color}, ${provider.color}99)`,
                      transition: "height 400ms ease",
                    }}/>
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(240,242,247,0.45)", fontWeight: 500 }}>{res}</div>
                </div>
              );
            })}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 16, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "rgba(240,242,247,0.5)" }}>Monthly Total</span>
            <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace" }}>{fmt(provider.total)}</span>
          </div>
        </div>

        {/* Recommendation */}
        <div style={{ background: "#111318", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 16, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(240,242,247,0.4)", marginBottom: 4 }}>Optimal provider</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{CHEAPEST.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: CHEAPEST.color, background: `${CHEAPEST.color}20`, border: `1px solid ${CHEAPEST.color}40`, padding: "2px 8px", borderRadius: 999, fontFamily: "monospace" }}>Recommended</span>
            </div>
          </div>
          <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#4ade80", fontSize: 15, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)", padding: "6px 14px", borderRadius: 999 }}>
            ▼ {fmt(SAVINGS)}
          </div>
        </div>

        {/* Cost table */}
        <div style={{ background: "#111318", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#181c24" }}>
                <th style={TH}>Provider</th>
                {RESOURCES.map((r) => <th key={r} style={{ ...TH, textAlign: "right" }}>{r}</th>)}
                <th style={{ ...TH, textAlign: "right", color: "#4ade80" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {PROVIDERS.map((p) => (
                <tr key={p.id}
                  onClick={() => setActive(p.id)}
                  style={{ cursor: "pointer", background: p.id === CHEAPEST.id ? "rgba(74,222,128,0.04)" : "transparent", borderTop: "1px solid rgba(255,255,255,0.05)", transition: "background 150ms" }}>
                  <td style={{ padding: "10px 16px", fontWeight: 600 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }}/>
                      {p.name}
                    </span>
                  </td>
                  {RESOURCES.map((r) => (
                    <td key={r} style={{ padding: "10px 16px", textAlign: "right", fontFamily: "monospace", fontSize: 13, color: "rgba(240,242,247,0.55)" }}>{fmt(p.costsINR[r])}</td>
                  ))}
                  <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#4ade80" }}>{fmt(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

const TH = {
  padding: "10px 16px", textAlign: "left",
  fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
  textTransform: "uppercase", color: "rgba(240,242,247,0.4)",
  fontFamily: "monospace",
};
