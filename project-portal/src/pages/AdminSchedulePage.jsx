import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ScheduleAdminPanel from '../components/schedule/ScheduleAdminPanel';

export default function AdminSchedulePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('options');
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs = [
    { id: 'options', label: 'Options & Products' },
    { id: 'items', label: 'Items' },
    { id: 'sections', label: 'Sections' },
    { id: 'templates', label: 'Templates' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate(-1)} style={{ padding: 8 }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700 }}>Schedule of Finishes — Master Admin</h1>
      </div>

      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e2e8f0', paddingLeft: '24px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '16px 28px',
              borderBottom: activeTab === tab.id ? '3px solid #1B2B4B' : '3px solid transparent',
              fontWeight: activeTab === tab.id ? '600' : '500',
              color: activeTab === tab.id ? '#1B2B4B' : '#666',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <ScheduleAdminPanel 
          activeTab={activeTab} 
          key={refreshKey}
          onRefresh={() => setRefreshKey(k => k + 1)}
        />
      </div>
    </div>
  );
}
