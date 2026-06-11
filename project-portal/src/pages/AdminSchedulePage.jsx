import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ScheduleAdminPanel } from '../components/schedule';

export default function AdminSchedulePage() {
  const [itemsBySection, setItemsBySection] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMasterSchedule();
  }, []);

  async function fetchMasterSchedule() {
    setLoading(true);
    const { data } = await supabase
      .from('v_sched_master')
      .select('*')
      .order('section_order, item_order, sort_order');

    // Group by Section
    const grouped = data.reduce((acc, row) => {
      const section = acc.find(s => s.name === row.section);
      if (!section) {
        acc.push({
          id: row.section, // temporary
          name: row.section,
          sort_order: row.section_order,
          items: []
        });
      }
      const currentSection = acc.find(s => s.name === row.section);
      // Group items (we can enhance with CBI grouping later)
      let item = currentSection.items.find(i => i.label === row.item);
      if (!item) {
        item = { id: row.item, label: row.item, cbi_code: row.cbi_code, options: [] };
        currentSection.items.push(item);
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
    setLoading(false);
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Schedule of Finishes — Master Admin</h1>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>
        Manage templates, sections, items, options, and reference documents
      </p>

      {loading ? (
        <div>Loading master schedule...</div>
      ) : (
        <ScheduleAdminPanel 
          itemsBySection={itemsBySection} 
          onRefresh={fetchMasterSchedule}
          showCbiGrouping={true}
        />
      )}
    </div>
  );
}
