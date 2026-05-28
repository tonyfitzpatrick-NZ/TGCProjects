import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.logoMark}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="12" height="12" x="2" y="2" rx="2" fill="#534AB7"/>
              <rect width="12" height="12" x="14" y="2" rx="2" fill="#AFA9EC" opacity="0.6"/>
              <rect width="12" height="12" x="2" y="14" rx="2" fill="#AFA9EC" opacity="0.4"/>
              <rect width="12" height="12" x="14" y="14" rx="2" fill="#534AB7" opacity="0.8"/>
            </svg>
          </div>
          <div>
            <div style={styles.brandName}>Project Portal</div>
            <div style={styles.brandSub}>Meridian Developments</div>
          </div>
        </div>

        <h1 style={styles.heading}>Sign in to your workspace</h1>
        <p style={styles.sub}>Enter your credentials to access your projects</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={styles.help}>
          Access is by invitation only. Contact your project administrator if you need an account.
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F7F6F3',
    padding: '24px',
    fontFamily: "'DM Sans', system-ui, sans-serif"
  },
  card: {
    background: '#fff',
    border: '0.5px solid #E0DED6',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px'
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px'
  },
  logoMark: { flexShrink: 0 },
  brandName: { fontSize: '15px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em' },
  brandSub: { fontSize: '12px', color: '#888', marginTop: '1px' },
  heading: { fontSize: '22px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.03em', marginBottom: '6px' },
  sub: { fontSize: '14px', color: '#888', marginBottom: '28px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#444' },
  input: {
    padding: '10px 12px',
    border: '0.5px solid #D0CEC6',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    background: '#FAFAF8',
    color: '#1a1a1a',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s'
  },
  error: {
    background: '#FAECE7',
    color: '#993C1D',
    fontSize: '13px',
    padding: '10px 12px',
    borderRadius: '8px'
  },
  btn: {
    padding: '11px',
    background: '#534AB7',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: '4px',
    transition: 'background 0.15s'
  },
  help: {
    fontSize: '12px',
    color: '#aaa',
    marginTop: '24px',
    textAlign: 'center',
    lineHeight: '1.6'
  }
}
