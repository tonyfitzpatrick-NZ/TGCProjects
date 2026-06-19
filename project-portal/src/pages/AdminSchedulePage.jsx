// ============================================================
// src/pages/AdminSchedulePage.jsx
// Settings → Schedule of Finishes master library.
// Goes straight to the admin panel — no intermediate step.
// ScheduleAdminPanel manages its own internal tabs
// (Groups & Items / Products / Assign Products), so this page
// is just a thin header + container.
// ============================================================

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ScheduleAdminPanel from '../components/schedule/ScheduleAdminPanel'

const NAVY = '#1B2B4B'

export default function AdminSchedulePage() {
  const navigate = useNavigate()

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '0.5px solid #ECEAE4',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        background: '#fff',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '6px', border: '0.5px solid #E0DED6', borderRadius: '8px',
            background: 'transparent', cursor: 'pointer', color: '#666',
          }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: '17px', fontWeight: '600', color: NAVY, margin: 0, letterSpacing: '-0.02em' }}>
            Schedule of Finishes — Master Library
          </h1>
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
            Manage the groups, items and products available across all projects
          </div>
        </div>
      </div>

      {/* Admin panel (manages its own internal tabs) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <ScheduleAdminPanel />
      </div>
    </div>
  )
}
