  async function loadData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('v_sched_master')
        .select('*')
        .order('section_order, item_order, sort_order');

      if (error) throw error;

      if (!data || data.length === 0) {
        alert("No schedule data found. Make sure the schema was applied correctly.");
        setSections([]);
        return;
      }

      const grouped = data.reduce((acc, row) => {
        let section = acc.find(s => s.name === row.section);
        if (!section) {
          section = { 
            name: row.section, 
            sort_order: row.section_order || 0, 
            items: [] 
          };
          acc.push(section);
        }

        let item = section.items.find(i => i.label === row.item);
        if (!item) {
          item = {
            label: row.item,
            cbi_code: row.cbi_code,
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
            model_ref: row.model_ref
          });
        }
        return acc;
      }, []);

      setSections(grouped);
    } catch (e) {
      console.error('Load error:', e);
      alert(`Failed to load schedule data: ${e.message}`);
      setSections([]);
    } finally {
      setLoading(false);
    }
  }
