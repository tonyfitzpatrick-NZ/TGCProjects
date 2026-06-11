// ============================================================
// ScheduleAdminPanel.jsx
// Admin-only panel for adding/editing/deleting item options
// and linking CodeMark / BRANZ / manual documents.
// Only rendered when userRole === 'admin'
// ============================================================

import React from 'react';

export default function ScheduleAdminPanel() {
  return (
    <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
      <h3>Schedule Admin Panel</h3>
      <p>Full editing tools (CBI codes, descriptions, links, etc.) coming soon.</p>
    </div>
  );
}
