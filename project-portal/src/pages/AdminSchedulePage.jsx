import { useState } from 'react';
import { ScheduleAdminPanel } from '../components/schedule';

export default function AdminSchedulePage() {
  const [activeTab, setActiveTab] = useState('options');

  const tabs = [
    { id: 'templates', label: 'Templates' },
    { id: 'sections', label: 'Sections' },
    { id: 'items', label: 'Items' },
    { id: 'options', label: 'Options & Specs' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1a202c' }}>
          Schedule of Finishes — Master Admin
        </h1>
        <button 
          onClick={() => window.history.back()}
          style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 8 }}
        >
          ← Back
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              background: activeTab === tab.id ? '#1B2B4B' : '#f8fafc',
              color: activeTab === tab.id ? '#fff' : '#475569',
              border: 'none',
              borderRadius: '8px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ScheduleAdminPanel activeTab={activeTab} />
    </div>
  );
}
