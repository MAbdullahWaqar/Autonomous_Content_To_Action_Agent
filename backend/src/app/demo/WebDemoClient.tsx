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

type Source = 'text' | 'url' | 'pdf_base64';

export default function WebDemoClient() {
  const fb = useMemo(() => initFirebase(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [source, setSource] = useState<Source>('text');
  const [content, setContent] = useState('');
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
      <div style={{ padding: 24, maxWidth: 720, color: '#e4e4e7', fontFamily: 'system-ui' }}>
        <h1 style={{ fontSize: 22 }}>Web demo disabled</h1>
        <p>Add <code>NEXT_PUBLIC_FIREBASE_*</code> keys to <code>.env.local</code> (same web app as mobile), then rebuild. See <code>.env.local.example</code>.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e4e4e7', fontFamily: 'system-ui', padding: 24 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>CTA Agent — Web demo (optional)</h1>
      <p style={{ color: '#a1a1aa', marginBottom: 20, maxWidth: 720 }}>
        Same SSE pipeline as mobile. Use a Firebase email/password user from your project. Sandbox simulation — no production CRM/email.
      </p>

      {!token ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inp} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inp} />
          <button type="button" onClick={login} style={btn}>Sign in</button>
        </div>
      ) : (
        <>
          <button type="button" onClick={logout} style={{ ...btn, marginBottom: 16, background: '#27272a' }}>
            Sign out
          </button>
          <div style={{ marginBottom: 12 }}>
            {(['text', 'url', 'pdf_base64'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                style={{
                  ...chip,
                  borderColor: source === s ? '#6366f1' : '#3f3f46',
                  background: source === s ? '#1e1b4b' : '#18181b',
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder={source === 'url' ? 'https://…' : source === 'pdf_base64' ? 'Base64 PDF…' : 'Paste unstructured content…'}
            style={{ ...inp, width: '100%', maxWidth: 720, minHeight: 160, fontFamily: 'monospace', fontSize: 13 }}
          />
          <button type="button" disabled={busy} onClick={run} style={{ ...btn, marginTop: 12 }}>
            {busy ? 'Running…' : 'Run pipeline'}
          </button>
        </>
      )}

      {err && <p style={{ color: '#f87171', marginTop: 16 }}>{err}</p>}

      <h2 style={{ fontSize: 16, marginTop: 24 }}>Event log</h2>
      <pre
        style={{
          background: '#111',
          border: '1px solid #27272a',
          borderRadius: 8,
          padding: 12,
          maxHeight: 220,
          overflow: 'auto',
          fontSize: 11,
          color: '#a3e635',
        }}
      >
        {log.join('\n')}
      </pre>

      {resultJson && (
        <>
          <h2 style={{ fontSize: 16, marginTop: 24 }}>Final JSON (includes outcome_evidence)</h2>
          <pre
            style={{
              background: '#111',
              border: '1px solid #27272a',
              borderRadius: 8,
              padding: 12,
              maxHeight: 420,
              overflow: 'auto',
              fontSize: 11,
              color: '#e4e4e7',
            }}
          >
            {resultJson}
          </pre>
        </>
      )}
    </div>
  );
}

const inp: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #3f3f46',
  background: '#09090b',
  color: '#fafafa',
};

const btn: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  border: 'none',
  background: '#6366f1',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const chip: CSSProperties = {
  padding: '6px 12px',
  borderRadius: 8,
  border: '1px solid #3f3f46',
  marginRight: 8,
  color: '#e4e4e7',
  cursor: 'pointer',
};
