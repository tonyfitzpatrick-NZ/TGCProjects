// ============================================================
// ScheduleAdminPanel.jsx
// Admin-only panel for adding/editing/deleting item options
// and linking CodeMark / BRANZ / manual documents.
// Only rendered when userRole === 'admin'
// ============================================================

import React from 'react';

export default function ScheduleAdminPanel() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>Schedule Admin Panel</h2>
      <p>Master schedule management is loading...</p>
      <p style={{ marginTop: '20px', color: '#666' }}>
        Full CRUD, AI research, and document management coming in the next update.
      </p>
    </div>
  );
}
