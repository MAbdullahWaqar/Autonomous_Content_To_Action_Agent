import Link from 'next/link';

export default function Home() {
  return (
    <main className="demo-layout animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div className="header-container delay-100 animate-fade-in">
        <span className="badge">Platform Engine</span>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.1 }} className="gradient-text">
          CTA Agent API
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#a1a1aa', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
          The autonomous orchestration layer powering our 6-agent AI pipeline.
        </p>
      </div>

      <div className="glass-panel delay-200 animate-fade-in" style={{ width: '100%', maxWidth: '720px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#f4f4f5' }}>Available Endpoints & Services</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '0.5rem', color: '#818cf8', fontWeight: 600 }}>POST</div>
            <div>
              <code style={{ color: '#e4e4e7', fontSize: '0.9rem', fontFamily: 'monospace' }}>/api/pipeline</code>
              <p style={{ color: '#a1a1aa', fontSize: '0.875rem', marginTop: '0.25rem' }}>Core SSE streaming pipeline. Accepts content and source parameters.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '0.5rem', color: '#34d399', fontWeight: 600 }}>WEB</div>
            <div>
              <Link href="/demo" className="link" style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>Interactive Sandbox Demo</Link>
              <p style={{ color: '#a1a1aa', fontSize: '0.875rem', marginTop: '0.25rem' }}>Test the live pipeline directly in your browser with real-time logs.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(96, 165, 250, 0.1)', borderRadius: '0.5rem', color: '#60a5fa', fontWeight: 600 }}>GET</div>
            <div>
              <code style={{ color: '#e4e4e7', fontSize: '0.9rem', fontFamily: 'monospace' }}>/api/reports</code>
              <p style={{ color: '#a1a1aa', fontSize: '0.875rem', marginTop: '0.25rem' }}>Fetch historical pipeline execution records and metadata.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="delay-300 animate-fade-in" style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
        <Link href="/demo">
          <button className="btn-primary">Launch Demo Console</button>
        </Link>
      </div>
    </main>
  );
}
