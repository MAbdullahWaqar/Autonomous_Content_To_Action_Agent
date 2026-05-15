export default function Home() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#e0e0e0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem',
    }}>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 800,
        background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '1rem',
      }}>
        CTA Agent API
      </h1>
      <p style={{ fontSize: '1.1rem', color: '#888', textAlign: 'center', maxWidth: '500px' }}>
        Autonomous Content-to-Action Agent Backend.
        This server powers the mobile app&apos;s 6-agent AI pipeline.
      </p>
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
      }}>
        <p>📡 POST /api/pipeline — SSE pipeline. Body JSON: content (string) + source (text | url | pdf_base64)</p>
        <p>🌐 <a href="/demo" style={{ color: '#93c5fd' }}>Web demo (optional)</a> — same pipeline in browser (Firebase login)</p>
        <p>📋 GET /api/reports — Fetch saved reports</p>
        <p>📦 GET /api/samples — Get sample content</p>
      </div>
    </main>
  );
}
