/**
 * Atomity — Cloud Cost Intelligence
 * Option B (0:45–0:55): Multi-cloud provider cost breakdown visualization
 */

import { useState, useEffect, useRef, useMemo } from "react";

/* ─────────────────────────────────────────────
   TOKENS
   ───────────────────────────────────────────── */
const CSS_VARS = `
  :root {
    --color-bg:           #0a0c10;
    --color-surface:      #111318;
    --color-surface-2:    #181c24;
    --color-border:       rgba(255,255,255,0.07);
    --color-border-glow:  rgba(74,222,128,0.35);
    --color-text-primary: #f0f2f7;
    --color-text-muted:   rgba(240,242,247,0.45);
    --color-accent:       #4ade80;
    --color-accent-dim:   rgba(74,222,128,0.15);
    --color-accent-glow:  rgba(74,222,128,0.08);
    --color-aws:          #ff9900;
    --color-azure:        #0078d4;
    --color-gcp:          #4285f4;
    --color-warn:         #f59e0b;
    --color-danger:       #ef4444;
    --radius-sm:          6px;
    --radius-md:          12px;
    --radius-lg:          20px;
    --radius-xl:          28px;
    --space-1:            4px;
    --space-2:            8px;
    --space-3:            12px;
    --space-4:            16px;
    --space-6:            24px;
    --space-8:            32px;
    --space-12:           48px;
    --space-16:           64px;
    --font-mono:          'JetBrains Mono', 'Fira Code', monospace;
    --font-sans:          'DM Sans', system-ui, sans-serif;
    --transition-fast:    150ms cubic-bezier(0.4,0,0.2,1);
    --transition-base:    300ms cubic-bezier(0.4,0,0.2,1);
    --transition-slow:    600ms cubic-bezier(0.16,1,0.3,1);
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--color-bg);
    color: var(--color-text-primary);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes barGrow {
    from { transform: scaleY(0); }
    to   { transform: scaleY(1); }
  }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 var(--color-border-glow); }
    70%  { box-shadow: 0 0 0 12px rgba(74,222,128,0); }
    100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
  }
  @keyframes drawLine {
    from { stroke-dashoffset: 300; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes shimmer {
    from { background-position: -200% center; }
    to   { background-position: 200% center; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-6px); }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`;

/* ─────────────────────────────────────────────
   HOOKS
   ───────────────────────────────────────────── */
const dataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const MOCK_POSTS = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  body: "quia et suscipit suscipit recusandae consequuntur expedita et cum reprehenderit molestiae ut ut quas totam nostrum rerum est autem sunt rem eveniet architecto".slice(0, 60 + ((i * 17) % 80)),
}));

function buildCloudData(posts) {
  const resources = ["CPU", "GPU", "RAM", "Storage", "Network", "Cloud"];
  const providers = [
    { id: "aws",   name: "AWS",   label: "Amazon Web Services", color: "var(--color-aws)",   region: "us-east-1"    },
    { id: "azure", name: "Azure", label: "Microsoft Azure",     color: "var(--color-azure)", region: "westeurope"   },
    { id: "gcp",   name: "GCP",   label: "Google Cloud",        color: "var(--color-gcp)",   region: "europe-west1" },
  ];
  const multipliers = [1.4, 1.1, 0.9];
  const enriched = providers.map((p, pi) => ({
    ...p,
    resources: resources.map((res, ri) => {
      const post = posts[pi * 6 + ri];
      const base = ((post.id * 37 + post.body.length * 3) % 80) + 15;
      const cost = Math.round(base * multipliers[pi] * 10);
      return { name: res, cost };
    }),
    totalCost: 0,
  }));
  enriched.forEach((p) => { p.totalCost = p.resources.reduce((s, r) => s + r.cost, 0); });
  return { providers: enriched, fetchedAt: Date.now() };
}

function useCloudData() {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    const cacheKey = "cloud-providers";
    const cached = dataCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setState({ data: cached.value, loading: false, error: null });
      return;
    }

    const timeout = setTimeout(() => {
      const result = buildCloudData(MOCK_POSTS);
      dataCache.set(cacheKey, { value: result, ts: Date.now() });
      setState({ data: result, loading: false, error: null });
    }, 600);

    fetch("https://jsonplaceholder.typicode.com/posts?_limit=18")
      .then((r) => { if (!r.ok) throw new Error("Network error"); return r.json(); })
      .then((posts) => {
        clearTimeout(timeout);
        const result = buildCloudData(posts);
        dataCache.set(cacheKey, { value: result, ts: Date.now() });
        setState({ data: result, loading: false, error: null });
      })
      .catch(() => {});

    return () => clearTimeout(timeout);
  }, []);

  return state;
}

function useIntersection(ref) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return isVisible;
}

function useCountUp(target, isActive, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!isActive || !target) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, isActive, duration]);
  return value;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/* ─────────────────────────────────────────────
   COMPONENTS
   ───────────────────────────────────────────── */
function Skeleton({ width = "100%", height = 20, radius = 6, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: "linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-2) 50%, var(--color-surface) 75%)",
      backgroundSize: "200% auto",
      animation: "shimmer 1.5s infinite linear",
      ...style,
    }} />
  );
}

function Badge({ children, color = "var(--color-accent)", style = {} }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "var(--space-1)",
      padding: "2px 8px", borderRadius: "999px", fontSize: 11, fontWeight: 600,
      letterSpacing: "0.04em", textTransform: "uppercase", color,
      background: `color-mix(in srgb, ${color} 12%, transparent)`,
      border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
      fontFamily: "var(--font-mono)", ...style,
    }}>
      {children}
    </span>
  );
}

function AnimatedNumber({ value, prefix = "$", isActive, delay = 0 }) {
  const delayed = useRef(false);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (isActive && !delayed.current) {
      delayed.current = true;
      const t = setTimeout(() => setStarted(true), delay);
      return () => clearTimeout(t);
    }
  }, [isActive, delay]);
  const count = useCountUp(value, started);
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
      {prefix}{count.toLocaleString()}
    </span>
  );
}

function AWSIcon({ size = 32 }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 80 50" fill="none">
      <text x="0" y="36" fontFamily="Arial Black, sans-serif" fontSize="34" fontWeight="900" fill="#ff9900">aws</text>
      <path d="M4 43 Q40 55 76 43" stroke="#ff9900" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M70 38 L76 43 L68 46" stroke="#ff9900" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function AzureIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" fill="none">
      <path d="M5 42 L22 8 L35 28 L20 28 Z" fill="#0078d4"/>
      <path d="M22 8 L42 42 L28 42 L35 28 Z" fill="#50abf1"/>
      <path d="M5 42 L20 28 L28 42 Z" fill="#005ba1"/>
    </svg>
  );
}

function GCPIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" fill="none">
      <circle cx="25" cy="25" r="20" fill="none" stroke="#e8e8e8" strokeWidth="4"/>
      <path d="M25 8 A17 17 0 0 1 42 25" stroke="#4285f4" strokeWidth="5" strokeLinecap="round"/>
      <path d="M42 25 A17 17 0 0 1 25 42" stroke="#ea4335" strokeWidth="5" strokeLinecap="round"/>
      <path d="M25 42 A17 17 0 0 1 8 25" stroke="#fbbc04" strokeWidth="5" strokeLinecap="round"/>
      <path d="M8 25 A17 17 0 0 1 25 8" stroke="#34a853" strokeWidth="5" strokeLinecap="round"/>
      <circle cx="25" cy="25" r="8" fill="white"/>
      <circle cx="25" cy="25" r="5" fill="#4285f4"/>
    </svg>
  );
}

function OnPremIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" fill="none">
      <rect x="8" y="14" width="34" height="22" rx="3" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"/>
      <rect x="14" y="20" width="8" height="10" rx="1" fill="var(--color-text-muted)" fillOpacity="0.4"/>
      <rect x="26" y="20" width="8" height="10" rx="1" fill="var(--color-text-muted)" fillOpacity="0.4"/>
      <line x1="25" y1="36" x2="25" y2="42" stroke="var(--color-text-muted)" strokeWidth="2"/>
      <line x1="15" y1="42" x2="35" y2="42" stroke="var(--color-text-muted)" strokeWidth="2"/>
    </svg>
  );
}

function ResourceBar({ resource, maxCost, isActive, delay, color }) {
  const heightPct = maxCost > 0 ? (resource.cost / maxCost) * 100 : 0;
  const reducedMotion = useReducedMotion();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)", flex: 1 }}>
      <div style={{
        fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)",
        opacity: isActive ? 1 : 0,
        transition: reducedMotion ? "none" : `opacity 300ms ${delay + 400}ms`,
      }}>
        ${resource.cost}
      </div>
      <div style={{ width: "100%", height: 120, display: "flex", alignItems: "flex-end", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "var(--radius-sm)", background: "var(--color-surface-2)" }} />
        <div style={{
          width: "100%", height: `${heightPct}%`, borderRadius: "var(--radius-sm)",
          background: `linear-gradient(to top, ${color}, color-mix(in srgb, ${color} 60%, white))`,
          boxShadow: isActive ? `0 0 16px color-mix(in srgb, ${color} 30%, transparent)` : "none",
          transformOrigin: "bottom",
          transform: isActive ? "scaleY(1)" : "scaleY(0)",
          transition: reducedMotion ? "none" : `transform 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, box-shadow var(--transition-base)`,
          position: "relative", zIndex: 1,
        }} />
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 500, letterSpacing: "0.02em" }}>
        {resource.name}
      </div>
    </div>
  );
}

function ProviderNode({ provider, isActive, delay, isSelected, onClick }) {
  const reducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const logos = { aws: AWSIcon, azure: AzureIcon, gcp: GCPIcon };
  const Logo = logos[provider.id];
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`Select ${provider.label}`}
      aria-pressed={isSelected}
      style={{
        all: "unset", cursor: "pointer", display: "flex", flexDirection: "column",
        alignItems: "center", gap: "var(--space-3)",
        opacity: isActive ? 1 : 0,
        transform: isActive ? (hovered ? "translateY(-4px) scale(1.03)" : "translateY(0) scale(1)") : "translateY(20px)",
        transition: reducedMotion ? "none" : `opacity 500ms ${delay}ms, transform 500ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div style={{
        width: 110, height: 110,
        background: isSelected
          ? `linear-gradient(135deg, color-mix(in srgb, ${provider.color} 20%, var(--color-surface-2)), var(--color-surface-2))`
          : "var(--color-surface)",
        border: `2px solid ${isSelected ? provider.color : (hovered ? "var(--color-border-glow)" : "var(--color-border)")}`,
        borderRadius: "var(--radius-lg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
        transition: "border-color var(--transition-base), background var(--transition-base), box-shadow var(--transition-base)",
        boxShadow: isSelected
          ? `0 0 24px color-mix(in srgb, ${provider.color} 25%, transparent)`
          : hovered ? "0 8px 32px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.2)",
        animation: isSelected && !reducedMotion ? "pulse-ring 2s infinite" : "none",
      }}>
        <Logo size={52} />
        {isSelected && (
          <div style={{ position: "absolute", inset: 8, pointerEvents: "none" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                position: "absolute", width: 5, height: 5, borderRadius: "50%",
                background: provider.color,
                top: [8, 4, 12][i] + "%", right: [8, 16, 4][i] + "%",
                opacity: 0.7,
                animation: reducedMotion ? "none" : `float 2s ease-in-out ${i * 0.4}s infinite`,
              }} />
            ))}
          </div>
        )}
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{provider.label}</div>
        <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{provider.region}</div>
      </div>
    </button>
  );
}

function ConnectionLines({ isActive }) {
  const reducedMotion = useReducedMotion();
  if (!isActive) return null;
  const lines = [
    { x1: "12%", y1: "25%", x2: "50%", y2: "50%", id: "aws",    color: "var(--color-aws)"   },
    { x1: "88%", y1: "25%", x2: "50%", y2: "50%", id: "azure",  color: "var(--color-azure)" },
    { x1: "12%", y1: "75%", x2: "50%", y2: "50%", id: "gcp",    color: "var(--color-gcp)"   },
    { x1: "88%", y1: "75%", x2: "50%", y2: "50%", id: "onprem", color: "rgba(255,255,255,0.15)" },
  ];
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} aria-hidden="true">
      {lines.map((l, i) => (
        <line key={l.id} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke={l.color} strokeWidth="1" strokeDasharray="4 6"
          style={{
            strokeDashoffset: reducedMotion ? 0 : 300,
            animation: reducedMotion ? "none" : `drawLine 1200ms cubic-bezier(0.16,1,0.3,1) ${i * 100 + 200}ms forwards`,
          }}
        />
      ))}
    </svg>
  );
}

function TableRow({ provider, isActive, delay, isHighlighted }) {
  const reducedMotion = useReducedMotion();
  return (
    <tr style={{
      opacity: isActive ? 1 : 0,
      transform: isActive ? "translateX(0)" : "translateX(-16px)",
      transition: reducedMotion ? "none" : `opacity 400ms ${delay}ms, transform 400ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      background: isHighlighted ? "color-mix(in srgb, var(--color-accent) 5%, transparent)" : "transparent",
    }}>
      <td style={{ padding: "10px 16px", fontWeight: 600, color: "var(--color-text-primary)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: provider.color, display: "inline-block" }} />
          {provider.name}
        </span>
      </td>
      {provider.resources.map((r) => (
        <td key={r.name} style={{ padding: "10px 16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-text-muted)", textAlign: "right" }}>
          ${r.cost}
        </td>
      ))}
      <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--color-accent)", textAlign: "right" }}>
        ${provider.totalCost.toLocaleString()}
      </td>
    </tr>
  );
}

function SavingsChip({ amount, isActive, delay }) {
  const reducedMotion = useReducedMotion();
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
      padding: "6px 14px", borderRadius: "999px",
      background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface))",
      border: "1px solid var(--color-border-glow)",
      fontSize: 13, fontWeight: 600, color: "var(--color-accent)", fontFamily: "var(--font-mono)",
      opacity: isActive ? 1 : 0,
      transform: isActive ? "scale(1)" : "scale(0.85)",
      transition: reducedMotion ? "none" : `opacity 500ms ${delay}ms, transform 500ms cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
    }}>
      <span>▼</span>
      <AnimatedNumber value={amount} prefix="$" isActive={isActive} delay={delay} />
      <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>/ mo savings</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN SECTION
   ───────────────────────────────────────────── */
function CloudIntelligenceSection() {
  const { data, loading, error } = useCloudData();
  const sectionRef = useRef(null);
  const isVisible = useIntersection(sectionRef);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (data && isVisible && !selectedProvider) {
      const t = setTimeout(() => setSelectedProvider(data.providers[0].id), 600);
      return () => clearTimeout(t);
    }
  }, [data, isVisible, selectedProvider]);

  const activeProvider = useMemo(
    () => data?.providers.find((p) => p.id === selectedProvider),
    [data, selectedProvider]
  );
  const maxCost = useMemo(
    () => activeProvider ? Math.max(...activeProvider.resources.map((r) => r.cost)) : 0,
    [activeProvider]
  );
  const cheapestProvider = useMemo(
    () => data ? data.providers.reduce((a, b) => a.totalCost < b.totalCost ? a : b) : null,
    [data]
  );
  const potentialSavings = useMemo(() => {
    if (!data) return 0;
    const max = Math.max(...data.providers.map((p) => p.totalCost));
    const min = Math.min(...data.providers.map((p) => p.totalCost));
    return max - min;
  }, [data]);

  return (
    <section ref={sectionRef} aria-labelledby="section-heading" style={{
      minHeight: "100vh",
      padding: "clamp(var(--space-8), 8vw, var(--space-16)) clamp(var(--space-4), 5vw, var(--space-12))",
      display: "flex", flexDirection: "column", alignItems: "center",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background grid */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(rgba(74,222,128,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.03) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent)",
      }} />
      <div aria-hidden="true" style={{
        position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
        width: 600, height: 300,
        background: "radial-gradient(ellipse, rgba(74,222,128,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{
        textAlign: "center", marginBottom: "var(--space-12)", position: "relative", zIndex: 1,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(24px)",
        transition: reducedMotion ? "none" : "opacity 600ms, transform 600ms cubic-bezier(0.16,1,0.3,1)",
      }}>
        <Badge style={{ marginBottom: "var(--space-4)" }}>◈ Multi-Cloud Intelligence</Badge>
        <h2 id="section-heading" style={{
          fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em",
          lineHeight: 1.1, marginBottom: "var(--space-4)",
          background: "linear-gradient(135deg, var(--color-text-primary) 40%, var(--color-text-muted))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          See where your cloud budget<br />
          <span style={{
            background: "linear-gradient(90deg, var(--color-accent), #60a5fa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            actually goes.
          </span>
        </h2>
        <p style={{ fontSize: "clamp(14px, 2vw, 17px)", color: "var(--color-text-muted)", maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
          Atomity normalizes spend across AWS, Azure, and GCP — so you can compare, optimize, and act in one place.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ width: "100%", maxWidth: 900, display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Skeleton height={200} radius={20} />
          <div style={{ display: "flex", gap: "var(--space-4)" }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} height={120} radius={12} />)}
          </div>
          <Skeleton height={180} radius={12} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div role="alert" style={{
          padding: "var(--space-6)", borderRadius: "var(--radius-md)",
          border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)",
          color: "var(--color-danger)", textAlign: "center",
        }}>
          <strong>Unable to load cloud data.</strong>
          <p style={{ marginTop: "var(--space-2)", fontSize: 13, color: "var(--color-text-muted)" }}>{error}</p>
        </div>
      )}

      {/* Data */}
      {data && (
        <div style={{ width: "100%", maxWidth: 1000, display: "flex", flexDirection: "column", gap: "var(--space-6)", position: "relative", zIndex: 1 }}>

          {/* Topology */}
          <div style={{
            position: "relative", minHeight: 340,
            display: "grid", gridTemplateColumns: "1fr auto 1fr", gridTemplateRows: "1fr 1fr",
            gap: "var(--space-6)", alignItems: "center", justifyItems: "center",
          }}>
            <ConnectionLines isActive={isVisible} />

            {/* AWS top-left */}
            <div style={{ gridColumn: 1, gridRow: 1, zIndex: 2, justifySelf: "end" }}>
              <ProviderNode provider={data.providers[0]} isActive={isVisible} delay={0}
                isSelected={selectedProvider === data.providers[0].id}
                onClick={() => setSelectedProvider(data.providers[0].id)} />
            </div>

            {/* Center chart */}
            <div style={{ gridColumn: 2, gridRow: "1 / 3", zIndex: 2, width: "clamp(200px, 28vw, 300px)" }}>
              <div style={{
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--color-border-glow)",
                background: "linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-2) 100%)",
                padding: "var(--space-6)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.4), 0 0 48px rgba(74,222,128,0.05)",
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "scale(1)" : "scale(0.9)",
                transition: reducedMotion ? "none" : "opacity 700ms 300ms, transform 700ms cubic-bezier(0.16,1,0.3,1) 300ms",
              }}>
                {/* Provider tabs */}
                <div style={{ display: "flex", gap: "var(--space-1)", marginBottom: "var(--space-4)" }}>
                  {data.providers.map((p) => (
                    <button key={p.id} onClick={() => setSelectedProvider(p.id)}
                      aria-label={`View ${p.name} breakdown`}
                      style={{
                        flex: 1, padding: "4px 0", borderRadius: "var(--radius-sm)", border: "none",
                        cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)",
                        background: selectedProvider === p.id ? p.color : "transparent",
                        color: selectedProvider === p.id ? "var(--color-bg)" : "var(--color-text-muted)",
                        transition: "background var(--transition-fast), color var(--transition-fast)",
                      }}>
                      {p.name}
                    </button>
                  ))}
                </div>

                {/* Bars */}
                {activeProvider && (
                  <>
                    <div style={{ display: "flex", gap: 4, alignItems: "flex-end", marginBottom: "var(--space-3)" }}>
                      {activeProvider.resources.map((r, i) => (
                        <ResourceBar key={r.name} resource={r} maxCost={maxCost}
                          isActive={isVisible} delay={i * 80 + 400} color={activeProvider.color} />
                      ))}
                    </div>
                    <div style={{ paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 500 }}>Monthly Total</span>
                      <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>
                        <AnimatedNumber value={activeProvider.totalCost} isActive={isVisible} delay={600} />
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Azure top-right */}
            <div style={{ gridColumn: 3, gridRow: 1, zIndex: 2, justifySelf: "start" }}>
              <ProviderNode provider={data.providers[1]} isActive={isVisible} delay={100}
                isSelected={selectedProvider === data.providers[1].id}
                onClick={() => setSelectedProvider(data.providers[1].id)} />
            </div>

            {/* GCP bottom-left */}
            <div style={{ gridColumn: 1, gridRow: 2, zIndex: 2, justifySelf: "end" }}>
              <ProviderNode provider={data.providers[2]} isActive={isVisible} delay={200}
                isSelected={selectedProvider === data.providers[2].id}
                onClick={() => setSelectedProvider(data.providers[2].id)} />
            </div>

            {/* On-Premise bottom-right */}
            <div style={{
              gridColumn: 3, gridRow: 2, zIndex: 2, justifySelf: "start",
              opacity: isVisible ? 0.45 : 0,
              transition: reducedMotion ? "none" : "opacity 500ms 400ms",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)",
            }}>
              <div style={{
                width: 110, height: 110, background: "var(--color-surface)",
                border: "2px dashed var(--color-border)", borderRadius: "var(--radius-lg)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <OnPremIcon size={40} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)" }}>On-Premise</div>
                <Badge color="var(--color-text-muted)" style={{ marginTop: 4 }}>Coming soon</Badge>
              </div>
            </div>
          </div>

          {/* Savings bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: "var(--space-4)",
            padding: "var(--space-4) var(--space-6)", borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 8%, var(--color-surface)), var(--color-surface))",
            border: "1px solid var(--color-border-glow)",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(16px)",
            transition: reducedMotion ? "none" : "opacity 600ms 500ms, transform 600ms cubic-bezier(0.16,1,0.3,1) 500ms",
          }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>Optimal provider for your workload</div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <span style={{ fontSize: 17, fontWeight: 700 }}>{cheapestProvider?.label}</span>
                <Badge color={cheapestProvider?.color}>Recommended</Badge>
              </div>
            </div>
            <SavingsChip amount={potentialSavings} isActive={isVisible} delay={700} />
          </div>

          {/* Cost table */}
          <div style={{
            borderRadius: "var(--radius-lg)", overflow: "hidden",
            border: "1px solid var(--color-border)", background: "var(--color-surface)",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(20px)",
            transition: reducedMotion ? "none" : "opacity 600ms 600ms, transform 600ms cubic-bezier(0.16,1,0.3,1) 600ms",
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }} aria-label="Cloud provider cost comparison">
                <thead>
                  <tr style={{ background: "var(--color-surface-2)" }}>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Provider</th>
                    {data.providers[0].resources.map((r) => (
                      <th key={r.name} style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>{r.name}</th>
                    ))}
                    <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--color-accent)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.providers.map((p, i) => (
                    <TableRow key={p.id} provider={p} isActive={isVisible} delay={700 + i * 100} isHighlighted={p.id === cheapestProvider?.id} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--color-text-muted)", opacity: isVisible ? 0.6 : 0, transition: reducedMotion ? "none" : "opacity 600ms 900ms" }}>
            Data fetched from live API · Refreshes every 5 minutes · {new Date(data.fetchedAt).toLocaleTimeString()}
          </div>
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────
   APP ROOT
   ───────────────────────────────────────────── */
export default function App() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS_VARS }} />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <main>
        <section style={{
          minHeight: "60vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", textAlign: "center",
          padding: "var(--space-16) var(--space-6)", gap: "var(--space-6)",
          animation: "fadeIn 800ms ease-out",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
            padding: "6px 16px", borderRadius: "999px", border: "1px solid var(--color-border)",
            fontSize: 12, color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-accent)", display: "inline-block", animation: "pulse-ring 2s infinite" }} />
            ATOMITY · CLOUD COST INTELLIGENCE
          </div>
          <h1 style={{
            fontSize: "clamp(36px, 7vw, 72px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05,
            background: "linear-gradient(160deg, var(--color-text-primary) 50%, var(--color-text-muted))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Stop guessing.<br />Start optimizing.
          </h1>
          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "var(--color-text-muted)", maxWidth: 480, lineHeight: 1.65 }}>
            Real-time visibility into every dollar spent across your entire cloud infrastructure.
          </p>
          <div style={{
            marginTop: "var(--space-8)", display: "flex", flexDirection: "column",
            alignItems: "center", gap: "var(--space-2)", color: "var(--color-text-muted)",
            fontSize: 12, fontFamily: "var(--font-mono)", animation: "float 3s ease-in-out infinite",
          }}>
            <span>scroll to explore</span>
            <span style={{ fontSize: 18 }}>↓</span>
          </div>
        </section>
        <CloudIntelligenceSection />
        <div style={{ height: "20vh" }} />
      </main>
    </>
  );
}
