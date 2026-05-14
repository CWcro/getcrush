export default function MobileLanding() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0f0d0b 0%, #1a1612 50%, #0f0d0b 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0",
      fontFamily: "'Cabinet Grotesk', system-ui, sans-serif",
      overflow: "hidden",
      position: "relative",
    }}>

      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, #bf5c40, transparent 70%)", top: "-80px", right: "-60px", filter: "blur(60px)", opacity: 0.3 }}/>
        <div style={{ position: "absolute", width: "250px", height: "250px", borderRadius: "50%", background: "radial-gradient(circle, #c99840, transparent 70%)", bottom: "15%", left: "-80px", filter: "blur(60px)", opacity: 0.2 }}/>
      </div>

      {/* Top section */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "60px 32px 0" }}>

        {/* Logo */}
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "3rem", fontWeight: "600", color: "#f2e8d9", letterSpacing: "-0.02em", marginBottom: "8px" }}>
          Get<span style={{ color: "#d97a5c" }}>Crush</span>
        </div>
        <div style={{ fontSize: "0.75rem", color: "#8a7868", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "48px" }}>
          Dating ohne Bullshit
        </div>

        {/* Phone mockup */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: "40px" }}>
          <div style={{
            width: "200px", height: "380px",
            background: "linear-gradient(160deg, #231e19, #1a1612)",
            borderRadius: "32px",
            border: "2px solid rgba(242,232,217,0.12)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(242,232,217,0.05) inset, 0 0 60px rgba(191,92,64,0.1)",
            overflow: "hidden",
            position: "relative",
          }}>
            {/* Phone screen content */}
            <div style={{ padding: "20px 16px" }}>
              <div style={{ fontSize: "0.55rem", color: "#d97a5c", fontWeight: "600", textAlign: "center", marginBottom: "12px", letterSpacing: "0.08em" }}>
                GetCrush
              </div>
              {/* Mini profile cards */}
              {[
                { name: "Sarah, 26", color: "#bf5c40" },
                { name: "Lena, 29", color: "#c99840" },
              ].map((p, i) => (
                <div key={i} style={{ background: "rgba(242,232,217,0.05)", borderRadius: "10px", padding: "10px", marginBottom: "8px", border: "1px solid rgba(242,232,217,0.07)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: p.color, flexShrink: 0, opacity: 0.8 }}/>
                  <div>
                    <div style={{ fontSize: "0.6rem", color: "#f2e8d9", fontWeight: "500" }}>{p.name}</div>
                    <div style={{ fontSize: "0.5rem", color: "#4a9e72" }}>● Online</div>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: "0.8rem" }}>❤️</div>
                </div>
              ))}
              <div style={{ marginTop: "12px", background: "rgba(191,92,64,0.15)", border: "1px solid rgba(191,92,64,0.3)", borderRadius: "10px", padding: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "0.5rem", color: "#d97a5c", fontWeight: "600" }}>✨ Match!</div>
                <div style={{ fontSize: "0.55rem", color: "#c4b09a", marginTop: "2px" }}>Schreib ihr jetzt!</div>
              </div>
            </div>
            {/* Bottom nav mock */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 20px", background: "rgba(15,13,11,0.9)", borderTop: "1px solid rgba(242,232,217,0.07)", display: "flex", justifyContent: "space-around" }}>
              {["🔍","💬","🗺️","👤"].map(icon => (
                <div key={icon} style={{ fontSize: "0.9rem", opacity: 0.7 }}>{icon}</div>
              ))}
            </div>
          </div>
          {/* Glow */}
          <div style={{ position: "absolute", bottom: "-20px", left: "50%", transform: "translateX(-50%)", width: "120px", height: "30px", background: "rgba(191,92,64,0.3)", filter: "blur(20px)", borderRadius: "50%" }}/>
        </div>

        {/* Headline */}
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2.2rem", fontWeight: "600", color: "#f2e8d9", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "14px" }}>
          Find your<br/><em style={{ color: "#d97a5c" }}>Crush.</em>
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#8a7868", lineHeight: 1.7, maxWidth: "280px", margin: "0 auto 32px", fontWeight: "300" }}>
          Keine Fake-Profile. Kein Abo.<br/>Kein Bullshit. Nur echte Menschen.
        </p>

        {/* Trust badges */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "40px" }}>
          {["🚫 Keine Fakes", "💸 0€", "✅ Echte Menschen"].map(b => (
            <div key={b} style={{ padding: "4px 12px", borderRadius: "50px", background: "rgba(242,232,217,0.05)", border: "1px solid rgba(242,232,217,0.1)", fontSize: "0.7rem", color: "#8a7868" }}>{b}</div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", padding: "0 24px 48px" }}>

        {/* App Store Button */}
        <a href="https://apps.apple.com" target="_blank" rel="noreferrer"
          style={{ display: "flex", alignItems: "center", gap: "14px", width: "100%", padding: "16px 24px", borderRadius: "16px", background: "#fff", border: "none", cursor: "pointer", marginBottom: "12px", textDecoration: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", transition: "transform 0.2s" }}
          onTouchStart={e => e.currentTarget.style.transform = "scale(0.98)"}
          onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="#000">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <div>
            <div style={{ fontSize: "0.65rem", color: "#666", lineHeight: 1 }}>Laden im</div>
            <div style={{ fontSize: "1rem", fontWeight: "700", color: "#000", lineHeight: 1.3 }}>App Store</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: "0.7rem", background: "#f0f0f0", borderRadius: "50px", padding: "3px 10px", color: "#666" }}>Bald</div>
        </a>

        {/* Google Play Button */}
        <a href="https://play.google.com" target="_blank" rel="noreferrer"
          style={{ display: "flex", alignItems: "center", gap: "14px", width: "100%", padding: "16px 24px", borderRadius: "16px", background: "#1a1a2e", border: "1px solid rgba(242,232,217,0.1)", cursor: "pointer", marginBottom: "20px", textDecoration: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", transition: "transform 0.2s" }}
          onTouchStart={e => e.currentTarget.style.transform = "scale(0.98)"}
          onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}>
          <svg viewBox="0 0 24 24" width="28" height="28">
            <path fill="#4CAF50" d="M1.22 0a1.22 1.22 0 0 0-1.22 1.22v21.56a1.22 1.22 0 0 0 1.22 1.22l11.71-11.5L1.22 0z"/>
            <path fill="#FFC107" d="M23.54 10.62l-3.02-1.72L16.8 12l3.72 3.1 3.02-1.72a1.22 1.22 0 0 0 0-2.76z"/>
            <path fill="#F44336" d="M16.8 12L1.22 24a1.22 1.22 0 0 0 1.58.07l16.94-9.62L16.8 12z"/>
            <path fill="#2196F3" d="M1.22 0L16.8 12 19.74 9.1 2.8-.07A1.22 1.22 0 0 0 1.22 0z"/>
          </svg>
          <div>
            <div style={{ fontSize: "0.65rem", color: "#8a7868", lineHeight: 1 }}>Jetzt bei</div>
            <div style={{ fontSize: "1rem", fontWeight: "700", color: "#f2e8d9", lineHeight: 1.3 }}>Google Play</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: "0.7rem", background: "rgba(242,232,217,0.08)", borderRadius: "50px", padding: "3px 10px", color: "#8a7868" }}>Bald</div>
        </a>

        {/* Continue in browser */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.72rem", color: "#8a7868", marginBottom: "6px" }}>App noch nicht verfügbar?</div>
          <button
            onClick={() => { window.location.href = "/?web=1"; }}
            style={{ background: "transparent", border: "none", color: "#d97a5c", fontSize: "0.82rem", cursor: "pointer", textDecoration: "underline", fontFamily: "system-ui" }}>
            Im Browser öffnen →
          </button>
        </div>
      </div>
    </div>
  );
}
