import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Check } from 'lucide-react'

export default function SettingsPage() {
  const { profile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [company, setCompany] = useState(profile?.company || '')
  const [initials, setInitials] = useState(profile?.avatar_initials || '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [pwError, setPwError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  async function saveProfile(e) {
    e.preventDefault()
    setLoading(true); setProfileError(''); setProfileSaved(false)
    const { error } = await supabase.from('profiles').update({
      full_name: fullName, company, avatar_initials: initials || fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    }).eq('id', profile.id)
    if (error) setProfileError(error.message)
    else setProfileSaved(true)
    setLoading(false)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  async function changePassword(e) {
    e.preventDefault()
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return }
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    setPwLoading(true); setPwError(''); setPwSaved(false)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) setPwError(error.message)
    else { setPwSaved(true); setCurrentPw(''); setNewPw(''); setConfirmPw('') }
    setPwLoading(false)
    setTimeout(() => setPwSaved(false), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={S.topbar}>
        <div style={S.title}>Settings</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div style={{ maxWidth: '520px' }}>

          {/* Profile */}
          <div style={S.card}>
            <div style={S.cardTitle}>Your profile</div>
            <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field label="Full name">
                <input style={S.input} value={fullName} onChange={e => setFullName(e.target.value)} />
              </Field>
              <Field label="Company / organisation">
                <input style={S.input} value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Morrison & Partners" />
              </Field>
              <Field label="Avatar initials (2 letters shown in the app)">
                <input style={{ ...S.input, width: '80px' }} value={initials} onChange={e => setInitials(e.target.value.slice(0, 2).toUpperCase())} placeholder="TF" maxLength={2} />
              </Field>
              <Field label="Role">
                <div style={{ ...S.input, background: '#F5F5F5', color: '#888', textTransform: 'capitalize' }}>
                  {profile?.role?.replace('_', ' ')} — contact an admin to change
                </div>
              </Field>
              {profileError && <div style={S.error}>{profileError}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button type="submit" style={S.btnPrimary} disabled={loading}>
                  {loading ? 'Saving…' : 'Save profile'}
                </button>
                {profileSaved && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0F6E56', fontSize: '13px' }}>
                    <Check size={14} /> Saved
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Password */}
          <div style={{ ...S.card, marginTop: '16px' }}>
            <div style={S.cardTitle}>Change password</div>
            <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field label="New password">
                <input style={S.input} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 8 characters" />
              </Field>
              <Field label="Confirm new password">
                <input style={S.input} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat password" />
              </Field>
              {pwError && <div style={S.error}>{pwError}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button type="submit" style={S.btnPrimary} disabled={pwLoading}>
                  {pwLoading ? 'Updating…' : 'Update password'}
                </button>
                {pwSaved && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0F6E56', fontSize: '13px' }}>
                    <Check size={14} /> Password updated
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Info */}
          <div style={{ ...S.card, marginTop: '16px', background: '#F7F6F3' }}>
            <div style={S.cardTitle}>Portal information</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                ['Logged in as', profile?.full_name],
                ['Email', '—'],
                ['Role', profile?.role?.replace('_', ' ')],
                ['Portal version', 'v1.0'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', fontSize: '13px' }}>
                  <div style={{ width: '140px', color: '#888', flexShrink: 0 }}>{label}</div>
                  <div style={{ color: '#1a1a1a', textTransform: 'capitalize' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>{label}</label>
      {children}
    </div>
  )
}

const S = {
  topbar: { padding: '14px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', alignItems: 'center' },
  title: { fontSize: '16px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em' },
  card: { background: '#fff', border: '0.5px solid #ECEAE4', borderRadius: '12px', padding: '20px' },
  cardTitle: { fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px', letterSpacing: '-0.01em' },
  input: { padding: '8px 10px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '100%', boxSizing: 'border-box' },
  error: { background: '#FAECE7', color: '#993C1D', fontSize: '13px', padding: '10px 12px', borderRadius: '8px' },
  btnPrimary: { padding: '8px 18px', background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
}
