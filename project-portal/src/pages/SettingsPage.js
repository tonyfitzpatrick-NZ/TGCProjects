import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Check, Settings, Calendar } from 'lucide-react';

export default function SettingsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === 'admin';

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [company, setCompany] = useState(profile?.company || '');
  const [initials, setInitials] = useState(profile?.avatar_initials || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('profile');

  async function saveProfile(e) {
    e.preventDefault();
    setLoading(true); 
    setProfileError(''); 
    setProfileSaved(false);

    const { error } = await supabase.from('profiles').update({
      full_name: fullName, 
      company, 
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

      <div style={{ display: 'flex', borderBottom: '1px solid #ECEAE4' }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{ ...S.tabBtn, background: activeTab === 'profile' ? '#fff' : 'transparent', fontWeight: activeTab === 'profile' ? '600' : '400' }}
        >
          <Settings size={16} /> My Profile
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('schedule-admin')}
            style={{ ...S.tabBtn, background: activeTab === 'schedule-admin' ? '#fff' : 'transparent', fontWeight: activeTab === 'schedule-admin' ? '600' : '400' }}
          >
            <Calendar size={16} /> Schedule of Finishes
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ maxWidth: '520px' }}>
            <div style={S.card}>
              <div style={S.cardTitle}>Your profile</div>
              <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Field label="Full name">
                  <input style={S.input} value={fullName} onChange={e => setFullName(e.target.value)} />
                </Field>
                <Field label="Company / organisation">
                  <input style={S.input} value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Morrison & Partners" />
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
        )}

        {/* Schedule Admin Tab */}
        {activeTab === 'schedule-admin' && isAdmin && (
          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '16px
