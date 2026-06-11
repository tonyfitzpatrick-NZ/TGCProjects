import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Check, Settings, Calendar, Users, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SettingsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === 'admin';

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [company, setCompany] = useState(profile?.company || '');
  const [initials, setInitials] = useState(profile?.avatar_initials || '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [pwError, setPwError] = useState('');

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'schedule-admin'

  async function saveProfile(e) {
    // ... (your existing saveProfile function - unchanged)
    e.preventDefault();
    // [Keep your existing saveProfile code here]
  }

  async function changePassword(e) {
    // ... (your existing changePassword function - unchanged)
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
        {/* Personal Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ maxWidth: '520px' }}>
            {/* Your existing Profile + Password cards here - unchanged */}
            {/* ... paste your existing profile and password cards ... */}
          </div>
        )}

        {/* Schedule Admin Tab */}
        {activeTab === 'schedule-admin' && isAdmin && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Schedule of Finishes — Master Admin</h2>
              <p style={{ color: '#64748b' }}>
                Manage templates, sections, items, options, CBI classifications, and reference documents.
              </p>
            </div>

            <button
              onClick={() => navigate('/admin/schedule')}
              style={{
                padding: '14px 24px',
                background: '#1B2B4B',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              Open Full Schedule Admin Panel →
            </button>

            <p style={{ marginTop: '16px', fontSize: '13px', color: '#888' }}>
              This will open the dedicated admin area where you can add/edit/delete elements, manage templates, and use AI research tools.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Keep your existing Field, S styles, and helper functions at the bottom
