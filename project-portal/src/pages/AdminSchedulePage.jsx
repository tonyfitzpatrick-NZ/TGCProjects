import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ScheduleAdminPanel } from '../components/schedule';

export default function AdminSchedulePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('options');
  const [itemsBySection, setItemsBySection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMasterData();
  }, []);

  async function fetchMasterData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('v_sched_master')
        .select('*')
        .order('section_order, item_order, sort_order');

      if (error) throw error;

      // Group by Section
      const grouped = data.reduce((acc, row) => {
        let section = acc.find(s => s.name === row.section);
        if (!section) {
          section = {
            id: `sec-${row.section}`,
            name: row.section,
            sort_order: row.section_order,
            items: []
          };
          acc.push(section);
        }

        let item = section.items.find(i => i.label === row.item);
        if (!item) {
          item = {
            id: row.item_id || `item-${row.item}`,
            label: row.item,
            cbi_code: row.cbi_code,
            sort_order: row.item_order,
            options: []
          };
          section.items.push(item);
        }

        if (row.option_id) {
          item.options.push({
            id: row.option_id,
            label: row.option_label,
            detail: row.detail,
            warranty: row.warranty,
            supplier: row.supplier,
            model_ref: row.model_ref,
            is_default: row.is_default
          });
        }

        return acc;
      }, []);

      setItemsBySection(grouped.sort((a, b) => a.sort_order - b.sort_order));
    } catch (err) {
      console.error('Failed to load master schedule:', err);
      alert('Failed to load master schedule data');
    } finally {
      setLoading(false);
    }
  }

  const filteredSections = itemsBySection.filter(section =>
    section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.items.some(item =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.cbi_code && item.cbi_code.includes(searchTerm))
    )
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* Top Bar */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #e2e8f0',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={24} />
        </button>

        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Schedule of Finishes — Master Admin</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Manage sections, items, options, templates and reference documents
          </p>
        </div>

        <button
          onClick={fetchMasterData}
          style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px'
      }}>
        {['options', 'sections', 'items', 'templates'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '16px 24px',
              borderBottom: activeTab === tab ? '3px solid #1B2B4B' : '3px solid transparent',
              fontWeight: activeTab === tab ? '600' : '500',
              color: activeTab === tab ? '#1B2B4B' : '#64748b',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            {tab === 'options' && 'Options & Documents'}
            {tab === 'sections' && 'Sections'}
            {tab === 'items' && 'Items'}
            {tab === 'templates' && 'Templates'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ position: 'relative', maxWidth: '500px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '11px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by item, section or CBI code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 44px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '15px'
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>Loading master schedule...</div>
        ) : (
          <ScheduleAdminPanel
            activeTab={activeTab}
            itemsBySection={filteredSections}
            onRefresh={fetchMasterData}
            searchTerm={searchTerm}
          />
        )}
      </div>
    </div>
  );
}
