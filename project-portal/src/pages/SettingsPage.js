import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Check } from 'lucide-react';

export default function SettingsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [companyName, setCompanyName] = useState(null);  // read-only, derived from profile.company_id
  const [initials, setInitials] = useState(profile?.avatar_initials || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [loading, setLoading] = useState(false);

  // Company affiliation is read-only here — it's managed by an
  // admin via Users & Access, not self-service. Look up the real
  // company name from profile.company_id rather than the old
  // free-text field, which no longer exists on profiles.
  useEffect(() => {
    if (!profile?.company_id) { setCompanyName(null); return; }
    supabase.from('companies').select('name').eq('id', profile.company_id).single()
      .then(({ data }) => setCompanyName(data?.name || null));
  }, [profile?.company_id]);

  async function saveProfile(e) {
    e.preventDefault();
    setLoading(true); 
    setProfileError(''); 
    setProfileSaved(false);

    const { error } = await supabase.from('profiles').update({
      full_name: fullName, 
      avatar_initials: initials || fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    }).eq('id', profile.id);

    if (error) setProfileError(error.message);
    else setProfileSaved(true);

    setLoading(false);
    setTimeout(() => setProfileSaved(false), 3000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={S.topbar}>
        <div style={S.title}>Settings {isAdmin && '— Admin'}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div style={{ maxWidth: '520px' }}>
          <div style={S.card}>
            <div style={S.cardTitle}>Your profile</div>
            <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field label="Full name">
                <input style={S.input} value={fullName} onChange={e => setFullName(e.target.value)} />
              </Field>
              <Field label="Company / organisation">
                <div style={{ ...S.input, background: '#F5F5F5', color: '#888' }}>
                  {companyName || 'TGC Homes (in-house)'}
                </div>
              </Field>
              <Field label="Avatar initials (2 letters)">
                <input style={{ ...S.input, width: '80px' }} value={initials} onChange={e => setInitials(e.target.value.slice(0, 2).toUpperCase())} placeholder="TF" maxLength={2} />
              </Field>
              <Field label="Role">
                <div style={{ ...S.input, background: '#F5F5F5', color: '#888', textTransform: 'capitalize' }}>
                  {profile?.role?.replace('_', ' ')}
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
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>{label}</label>
      {children}
    </div>
  );
}

const S = {
  topbar: { padding: '14px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', alignItems: 'center' },
  title: { fontSize: '16px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em' },
  card: { background: '#fff', border: '0.5px solid #ECEAE4', borderRadius: '12px', padding: '20px' },
  cardTitle: { fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px', letterSpacing: '-0.01em' },
  input: { padding: '8px 10px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '100%', boxSizing: 'border-box' },
  error: { background: '#FAECE7', color: '#993C1D', fontSize: '13px', padding: '10px 12px', borderRadius: '8px' },
  btnPrimary: { padding: '8px 18px', background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
};
