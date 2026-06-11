// ============================================================
// ScheduleAdminPanel.jsx
// Admin-only panel for adding/editing/deleting item options
// and linking CodeMark / BRANZ / manual documents.
// Only rendered when userRole === 'admin'
// ============================================================

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ExternalLink, Search, RefreshCw } from 'lucide-react';
import {
  addItemOption,
  deleteItemOption,
  addOptionDoc,
  deleteOptionDoc,
  fetchOptionDocs,
} from '../../lib/scheduleQueries';

const DOC_TYPES = ['codemark', 'branz', 'manual', 'datasheet', 'other'];

export default function ScheduleAdminPanel({ 
  activeTab = 'options', 
  itemsBySection = [], 
  onRefresh 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showAddOptionFor, setShowAddOptionFor] = useState(null);

  // AI Research (placeholder - can connect to real API later)
  const handleAIResearch = (itemLabel, optionLabel = '') => {
    const query = optionLabel ? `${itemLabel} ${optionLabel}` : itemLabel;
    alert(`🔍 AI Research initiated for: "${query}"\n\nThis will search for latest specs, CodeMark, BRANZ, datasheets, and warranties.`);
    // Future: Call Grok / OpenAI via Supabase Edge Function
  };

  const filteredSections = itemsBySection.filter(section =>
    section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.items.some(item => 
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.cbi_code || '').includes(searchTerm)
    )
  );

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search sections, items, or CBI codes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <button onClick={onRefresh} style={{ padding: '10px 16px', background: '#f1f5f9', borderRadius: 8 }}>
          <RefreshCw size={18} />
        </button>
      </div>

      {activeTab === 'options' && (
        <div>
          {filteredSections.map(section => (
            <div key={section.id} style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '16px', color: '#1a202c', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                {section.name}
              </h3>

              {section.items.map(item => (
                <div key={item.id} style={{ 
                  background: '#fff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  padding: '20px', 
                  marginBottom: '20px' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <strong style={{ fontSize: '16px' }}>{item.label}</strong>
                      {item.cbi_code && <span style={{ marginLeft: '12px', fontSize: '13px', color: '#64748b' }}>CBI: {item.cbi_code}</span>}
                    </div>
                    <button 
                      onClick={() => handleAIResearch(item.label)}
                      style={{ color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      🔍 AI Research
                    </button>
                  </div>

                  {/* Options */}
                  {(item.options || []).map(opt => (
                    <div key={opt.id} style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>{opt.label}</div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>{opt.detail}</div>
                          {opt.supplier && <div style={{ fontSize: '12px' }}>Supplier: {opt.supplier}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleAIResearch(item.label, opt.label)} style={{ fontSize: '12px', color: '#3b82f6' }}>AI Suggest</button>
                          <button onClick={() => alert('Edit coming soon')} style={{ color: '#64748b' }}><Edit2 size={16} /></button>
                          <button onClick={() => deleteItemOption(opt.id).then(onRefresh)} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setShowAddOptionFor(item.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', background: 'none', border: '1px dashed #c4b5fd', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    <Plus size={16} /> Add new option for this item
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Placeholder tabs for future expansion */}
      {activeTab === 'sections' && <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Sections Management (Full CRUD coming soon)</div>}
      {activeTab === 'items' && <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Items Management (Full CRUD coming soon)</div>}
      {activeTab === 'templates' && <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Templates Management (Full CRUD coming soon)</div>}

    </div>
  );
}
