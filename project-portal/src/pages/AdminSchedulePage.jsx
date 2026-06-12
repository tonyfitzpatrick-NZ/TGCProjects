import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ScheduleAdminPanel from '../components/schedule/ScheduleAdminPanel';

export default function AdminSchedulePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('options');

  const tabs = [
    { id: 'options', label: 'Options & Products' },
    { id: 'items', label: 'Items' },
    { id: 'sections', label: 'Sections' },
    { id: 'templates', label: 'Templates' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '24px', margin: 0 }}>Schedule of Finishes — Master Admin</h1>
      </div>

      {/* Tabs controlled here */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 24px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '14px 32px',
              borderBottom: activeTab === tab.id ? '3px solid #1B2B4B' : '3px solid transparent',
              fontWeight: activeTab === tab.id ? '600' : '500',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pass activeTab to the panel */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <ScheduleAdminPanel activeTab={activeTab} />
      </div>
    </div>
  );
}
