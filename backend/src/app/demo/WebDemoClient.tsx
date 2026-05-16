'use client';

import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, type Auth } from 'firebase/auth';

function getClientConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  };
}

function initFirebase(): { app: FirebaseApp; auth: Auth } | null {
  const cfg = getClientConfig();
  if (!cfg) return null;
  const app = getApps().length ? getApps()[0]! : initializeApp(cfg);
  return { app, auth: getAuth(app) };
}

type Source = 'text' | 'url' | 'pdf_base64' | 'image_base64';

export default function WebDemoClient() {
  const fb = useMemo(() => initFirebase(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [source, setSource] = useState<Source>('text');
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [resultJson, setResultJson] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const append = (line: string) => setLog((p) => [...p.slice(-400), line]);

  const login = async () => {
    if (!fb) return;
    setErr('');
    const u = await signInWithEmailAndPassword(fb.auth, email.trim(), password);
    setToken(await u.user.getIdToken());
    append('Signed in.');
  };

  const logout = async () => {
    if (!fb) return;
    await signOut(fb.auth);
    setToken(null);
    setResultJson('');
    append('Signed out.');
  };

  const run = async () => {
    if (!token) {
      setErr('Sign in first.');
      return;
    }
    setBusy(true);
    setErr('');
    setLog([]);
    setResultJson('');
    append('POST /api/pipeline …');
    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, source }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`${res.status} ${t}`);
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No body');
      const dec = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6)) as { type: string; agent?: string; error?: string };
            append(`${ev.type}${ev.agent ? ` · ${ev.agent}` : ''}${ev.error ? ` — ${ev.error}` : ''}`);
            if (ev.type === 'pipeline_complete') {
              const data = (ev as { data?: unknown }).data;
              if (data) setResultJson(JSON.stringify(data, null, 2));
            }
            if (ev.type === 'pipeline_error') {
              setErr((ev as { error?: string }).error || 'Pipeline error');
            }
          } catch {
            /* ignore partial */
          }
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  if (!fb) {
    return (
      <div className="demo-layout animate-fade-in" style={{ padding: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }} className="gradient-text">Web demo disabled</h1>
          <p style={{ color: '#a1a1aa' }}>Add <code style={{ color: '#e4e4e7', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>NEXT_PUBLIC_FIREBASE_*</code> keys to <code style={{ color: '#e4e4e7', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>.env.local</code> (same web app as mobile), then rebuild. See <code style={{ color: '#e4e4e7', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>.env.local.example</code>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-layout animate-fade-in">
      <div className="header-container">
        <span className="badge delay-100 animate-fade-in">Interactive Sandbox</span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }} className="gradient-text delay-200 animate-fade-in">CTA Agent Demo</h1>
        <p style={{ color: '#a1a1aa', maxWidth: '600px', margin: '0 auto' }} className="delay-300 animate-fade-in">
          Same SSE pipeline as mobile. Use a Firebase email/password user from your project. Sandbox simulation — no production CRM/email.
        </p>
      </div>

      <div className="glass-panel delay-400 animate-fade-in" style={{ padding: '2rem' }}>
        {!token ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: '#f4f4f5' }}>Authentication Required</h2>
            <input className="input-field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input-field" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="btn-primary" type="button" onClick={login} style={{ marginTop: '0.5rem' }}>Sign In to Demo</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(['text', 'url', 'pdf_base64', 'image_base64'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSource(s);
                      if (s !== 'image_base64') setImagePreview(null);
                      if (s !== 'pdf_base64' && s !== 'image_base64') setContent('');
                    }}
                    className={`chip ${source === s ? 'active' : ''}`}
                  >
                    {s === 'pdf_base64'
                      ? 'PDF'
                      : s === 'image_base64'
                        ? 'Image'
                        : s.toUpperCase()}
                  </button>
                ))}
              </div>
              <button className="btn-secondary" type="button" onClick={logout} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                Sign out
              </button>
            </div>
            
            {source === 'pdf_base64' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>Upload a local PDF file:</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const result = evt.target?.result as string;
                      const base64 = result.split(',')[1];
                      if (base64) setContent(base64);
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="input-field"
                  style={{ cursor: 'pointer', padding: '0.5rem' }}
                />
                <label style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>Or paste Base64 directly:</label>
                <textarea
                  className="input-field"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  placeholder="Base64 encoded PDF string..."
                  style={{ resize: 'vertical', minHeight: '80px', fontSize: '0.75rem', fontFamily: 'monospace' }}
                />
              </div>
            ) : source === 'image_base64' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
                  Upload an image (chart, screenshot, photo). Gemini vision describes it before agents run.
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 4 * 1024 * 1024) {
                      setErr('Image must be under 4MB');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const result = evt.target?.result as string;
                      const base64 = result.split(',')[1];
                      if (base64) {
                        setContent(base64);
                        setImagePreview(result);
                        setErr('');
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="input-field"
                  style={{ cursor: 'pointer', padding: '0.5rem' }}
                />
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 240,
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                ) : null}
              </div>
            ) : (
              <textarea
                className="input-field"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder={source === 'url' ? 'https://example.com/article' : 'Paste unstructured content text here...'}
                style={{ resize: 'vertical', minHeight: '120px' }}
              />
            )}
            
            <button className="btn-primary" type="button" disabled={busy} onClick={run} style={{ alignSelf: 'flex-start' }}>
              {busy ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg style={{ height: '1rem', width: '1rem', animation: 'spin 1s linear infinite' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing Pipeline...
                </span>
              ) : 'Run Pipeline'}
            </button>
          </div>
        )}
      </div>

      {err && (
        <div className="glass-panel animate-fade-in" style={{ marginTop: '1.5rem', padding: '1rem', borderColor: 'rgba(248, 113, 113, 0.3)', background: 'rgba(248, 113, 113, 0.05)' }}>
          <p style={{ color: '#f87171', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {err}
          </p>
        </div>
      )}

      {(log.length > 0 || resultJson) && (
        <div className="glass-panel animate-fade-in" style={{ marginTop: '2rem', padding: '1.5rem' }}>
          {log.length > 0 && (
            <div style={{ marginBottom: resultJson ? '2rem' : '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1rem', color: '#f4f4f5', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg style={{ width: '1.25rem', height: '1.25rem', color: '#818cf8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                  Pipeline Event Log
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>{log.length} events</span>
              </div>
              <pre className="log-container">{log.join('\n')}</pre>
            </div>
          )}

          {resultJson && (
            <div className="animate-fade-in">
              <h2 style={{ fontSize: '1rem', color: '#f4f4f5', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg style={{ width: '1.25rem', height: '1.25rem', color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Final JSON (includes outcome_evidence)
              </h2>
              <pre className="log-container log-container-light">{resultJson}</pre>
            </div>
          )}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
