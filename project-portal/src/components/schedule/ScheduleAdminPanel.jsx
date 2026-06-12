{/* EDIT MODAL - With clear labels */}
{editingId && (
  <div style={{ 
    position: 'fixed', 
    top: 0, left: 0, right: 0, bottom: 0, 
    background: 'rgba(0,0,0,0.5)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 1000 
  }}>
    <div style={{ 
      background: '#fff', 
      padding: '24px', 
      borderRadius: '12px', 
      width: '560px', 
      maxHeight: '85vh', 
      overflowY: 'auto' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>Edit</h3>
        <button onClick={cancelEdit} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
          <X size={22} />
        </button>
      </div>

      {/* Name / Label */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>
          Name / Label
        </label>
        <input 
          value={editForm.label || editForm.name || ''} 
          onChange={e => setEditForm({ ...editForm, label: e.target.value, name: e.target.value })} 
          placeholder="Enter the product or item name"
          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} 
        />
      </div>

      {/* Description */}
      {editForm.type === 'product' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>
            Description / Details
          </label>
          <textarea 
            value={editForm.detail || ''} 
            onChange={e => setEditForm({ ...editForm, detail: e.target.value })} 
            placeholder="Enter a clear description of the product"
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', minHeight: '80px' }} 
          />
        </div>
      )}

      {/* Product Link */}
      {editForm.type === 'product' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>
            Product Page / Website Link
          </label>
          <input 
            value={editForm.product_link || ''} 
            onChange={e => setEditForm({ ...editForm, product_link: e.target.value })} 
            placeholder="https://www.example.com/product-page"
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} 
          />
        </div>
      )}

      {/* BRANZ Appraisal Link */}
      {editForm.type === 'product' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>
            BRANZ Appraisal Link
          </label>
          <input 
            value={editForm.branz_link || ''} 
            onChange={e => setEditForm({ ...editForm, branz_link: e.target.value })} 
            placeholder="https://www.branz.co.nz/appraisal/..."
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} 
          />
        </div>
      )}

      {/* CodeMark Certificate Link */}
      {editForm.type === 'product' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>
            CodeMark Certificate Link
          </label>
          <input 
            value={editForm.codemark_link || ''} 
            onChange={e => setEditForm({ ...editForm, codemark_link: e.target.value })} 
            placeholder="https://www.codemark.co.nz/..."
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} 
          />
        </div>
      )}

      {/* Installation Manual Link */}
      {editForm.type === 'product' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>
            Installation Manual Link
          </label>
          <input 
            value={editForm.certificate_notes || ''} 
            onChange={e => setEditForm({ ...editForm, certificate_notes: e.target.value })} 
            placeholder="Link to installation manual or datasheet"
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} 
          />
        </div>
      )}

      {/* Category selector for Items */}
      {editForm.type === 'item' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>
            Category / Section
          </label>
          <select 
            value={editForm.section_id || ''} 
            onChange={e => setEditForm({ ...editForm, section_id: e.target.value })}
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
          >
            {sectionsList.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
        <button 
          onClick={saveEdit} 
          style={{ 
            background: '#166534', 
            color: 'white', 
            padding: '12px 28px', 
            borderRadius: '8px', 
            border: 'none',
            fontWeight: '500'
          }}
        >
          Save Changes
        </button>
        <button 
          onClick={cancelEdit}
          style={{ 
            background: '#f3f4f6', 
            color: '#374151', 
            padding: '12px 28px', 
            borderRadius: '8px', 
            border: '1px solid #d1d5db'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
