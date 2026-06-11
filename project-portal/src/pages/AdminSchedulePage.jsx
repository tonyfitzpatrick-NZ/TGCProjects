import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Search } from 'lucide-react';
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
      const { data } = await supabase
        .from('v_sched_master')
        .select('*')
        .order('section_order, item_order, sort_order');

      const grouped = data.reduce((acc, row) => {
        let section = acc.find(s => s.name === row.section);
        if (!section) {
          section = { id: row.section, name: row.section, sort_order: row.section_order, items: [] };
          acc.push(section);
        }

        let item = section.items.find(i => i.label === row.item);
        if (!item) {
          item = {
            id: row.item_id,
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = itemsBySection.filter(section => 
    section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.items.some(item => 
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.cbi_code && item.cbi_code.includes(searchTerm))
    )
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate(-1)} style={{ padding: 8 }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700 }}>Schedule of Finishes — Master Admin</h1>
        </div>
        <button onClick={fetchMasterData} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, background: '#f1f5f9' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e2e8f0', paddingLeft: '24px' }}>
        {['options', 'sections', 'items', 'templates'].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              padding: '16px 28px',
              fontWeight: activeTab === t ? '600' : '500',
              borderBottom: activeTab === t ? '3px solid #1B2B4B' : '3px solid transparent',
              color: activeTab === t ? '#1B2B4B' : '#666'
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 24px', background: '#fff' }}>
        <input
          type="text"
          placeholder="Search items, sections or CBI codes..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: '500px', padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd' }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {loading ? <p>Loading...</p> : (
          <ScheduleAdminPanel 
            activeTab={activeTab} 
            itemsBySection={filtered} 
            onRefresh={fetchMasterData}
          />
        )}
      </div>
    </div>
  );
}
