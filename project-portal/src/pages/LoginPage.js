import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import logo from '../lib/logo'

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
          <div style={styles.logoWrap}>
            <img src={logo} alt="TGC Homes" style={styles.logo} />
          </div>
        </div>

        <div style={styles.divider} />

        <h1 style={styles.heading}>Project Portal</h1>
        <p style={styles.sub}>Sign in to access your projects</p>

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

const NAVY = '#1B2B4B'
const GOLD = '#B8952A'

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(135deg, ${NAVY} 0%, #243554 100%)`,
    padding: '24px',
    fontFamily: "'DM Sans', system-ui, sans-serif"
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  brand: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px'
  },
  logoWrap: {
    background: NAVY,
    borderRadius: '12px',
    padding: '14px 24px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    height: '52px',
    width: 'auto',
    objectFit: 'contain'
  },
  divider: {
    height: '1px',
    background: `linear-gradient(to right, transparent, ${GOLD}, transparent)`,
    marginBottom: '24px'
  },
  heading: {
    fontSize: '22px',
    fontWeight: '600',
    color: NAVY,
    letterSpacing: '-0.03em',
    marginBottom: '6px',
    textAlign: 'center'
  },
  sub: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '28px',
    textAlign: 'center'
  },
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
    background: NAVY,
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
