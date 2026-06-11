// ============================================================
// ScheduleAdminPanel.jsx
// Admin-only panel for adding/editing/deleting item options
// and linking CodeMark / BRANZ / manual documents.
// Only rendered when userRole === 'admin'
// ============================================================

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, Edit2, Search } from 'lucide-react';
import {
  addItemOption, deleteItemOption, addOptionDoc, deleteOptionDoc, fetchOptionDocs,
  // Add more queries as needed
} from '../../lib/scheduleQueries';

const DOC_TYPES = ['codemark', 'branz', 'manual', 'datasheet', 'other'];

export default function ScheduleAdminPanel({ activeTab = 'options', itemsBySection = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // AI Research Button (placeholder - connect to API later)
  const researchWithAI = (itemLabel, optionLabel) => {
    alert(`🔍 AI Research started for: ${itemLabel} → ${optionLabel || 'New Option'}\n\nThis will search for latest datasheets, CodeMark, warranties etc.`);
    // Future: Call Supabase Edge Function or Grok API
  };

  return (
    <div>
      {activeTab === 'options' && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search items or options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <button style={{ padding: '10px 16px', background: '#1B2B4B', color: '#fff', borderRadius: 8 }}>
              <Search size={18} />
            </button>
          </div>

          {itemsBySection.map(section => (
            <div key={section.id} style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, marginBottom: 12, color: '#1a202c' }}>{section.name}</h3>
              {section.items.map(item => (
                <div key={item.id} style={{ marginBottom: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <strong>{item.label}</strong>
                      {item.cbi_code && <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>CBI: {item.cbi_code}</span>}
                    </div>
                    <button 
                      onClick={() => researchWithAI(item.label)}
                      style={{ fontSize: 13, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      🔍 AI Research
                    </button>
                  </div>

                  {/* Options list (your existing logic) */}
                  {item.sched_item_options?.map(opt => (
                    <div key={opt.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>
                      {/* Your existing AdminOptionRow logic here or improved version */}
                      <div style={{ fontWeight: 500 }}>{opt.label}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{opt.detail}</div>
                      <button onClick={() => researchWithAI(item.label, opt.label)} style={{ fontSize: 12, color: '#3b82f6' }}>
                        Suggest updates via AI
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* TODO: Add other tabs (Templates, Sections, Items) similarly */}
      {activeTab === 'templates' && <div>Templates Management (coming soon)</div>}
      {activeTab === 'sections' && <div>Sections Management (coming soon)</div>}
      {activeTab === 'items' && <div>Items Management (coming soon)</div>}
    </div>
  );
}
