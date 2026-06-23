// ============================================================
// src/pages/BackupExportPage.js
// Admin-only data export — downloads a single JSON file
// containing every real table in the app.
//
// IMPORTANT — what this is and isn't:
//   - This IS a genuinely restorable snapshot of all your data.
//   - This is NOT a true Postgres database backup (schema,
//     indexes, RLS policies, storage files themselves aren't
//     included — only the data rows). A browser can't produce
//     a real pg_dump; only Supabase's own backup tools can.
//   - Login accounts (auth.users) are NOT included — those are
//     managed separately by Supabase Auth and aren't accessible
//     via this kind of export. Emails/passwords are safe in
//     Supabase regardless of this export.
//
// If this is ever needed to restore data after an incident, the
// JSON file would need a matching import script — ask Claude to
// write one against the specific file when that's needed, since
// the exact restore approach depends on what's actually broken.
// ============================================================

import { useState, Fragment } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Download, Database, CheckCircle, AlertTriangle } from 'lucide-react'

const NAVY = '#1B2B4B'
const GOLD = '#B8952A'

// Every real table the app uses. Order doesn't matter for export
// (unlike a restore, which would need dependency order) — this
// just reads each one independently.
const TABLES = [
  'companies',
  'profiles',
  'projects',
  'project_members',
  'project_company_access',
  'project_files',
  'message_threads',
  'project_messages',
  'tasks',
  'application_templates',
  'project_applications',
  'application_documents',
  'sched_groups',
  'sched_items',
  'sched_products',
  'sched_item_products',
  'sched_project_selections',
]

export default function BackupExportPage() {
  const { profile } = useAuth()
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(null)  // { table, index, total }
  const [result, setResult] = useState(null)       // { success, counts, error }

  const isAdmin = profile?.role === 'admin'

  async function runExport() {
    setExporting(true)
    setResult(null)
    const snapshot = {}
    const counts = {}

    try {
      for (let i = 0; i < TABLES.length; i++) {
        const table = TABLES[i]
        setProgress({ table, index: i + 1, total: TABLES.length })
        const { data, error } = await supabase.from(table).select('*')
        if (error) throw new Error(`${table}: ${error.message}`)
        snapshot[table] = data || []
        counts[table] = (data || []).length
      }

      const payload = {
        exported_at: new Date().toISOString(),
        exported_by: profile?.full_name || profile?.id,
        note: 'Data export only — does not include auth.users (logins), storage files, schema/RLS, or indexes. See BackupExportPage.js for details.',
        tables: snapshot,
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `tgc-portal-backup-${stamp}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setResult({ success: true, counts })
    } catch (e) {
      setResult({ success: false, error: e.message })
    } finally {
      setExporting(false)
      setProgress(null)
    }
  }

  if (!isAdmin) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
        Admin access required.
      </div>
    )
  }

  const totalRows = result?.success ? Object.values(result.counts).reduce((a, b) => a + b, 0) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 24px', borderBottom: '0.5px solid #ECEAE4' }}>
        <h1 style={{ fontSize: '17px', fontWeight: '600', color: NAVY, margin: 0, letterSpacing: '-0.02em' }}>
          Data Backup
        </h1>
        <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
          Download a snapshot of all project data
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '560px' }}>

        <div style={{ background: '#fff', border: '0.5px solid #ECEAE4', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Database size={18} color={GOLD} />
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>Export all data</div>
          </div>

          <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', marginBottom: '14px' }}>
            Downloads a single JSON file containing every project, task, company, message,
            schedule selection, and application across the whole portal. Keep this somewhere
            safe (e.g. a dated folder in your own cloud storage) as a recovery point.
          </p>

          <div style={{ background: '#FFF4E0', border: '0.5px solid #F0D9A8', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', fontSize: '12px', color: '#854F0B', lineHeight: '1.6' }}>
            <strong>This is a data export, not a full database backup.</strong> It does not
            include login accounts, uploaded files themselves, or the database's structure
            (tables/security rules) — only the data rows. Login accounts are managed separately
            by Supabase and are unaffected either way.
          </div>

          <button
            onClick={runExport}
            disabled={exporting}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', background: exporting ? '#ccc' : NAVY, color: '#fff',
              border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '500',
              cursor: exporting ? 'default' : 'pointer', fontFamily: 'inherit',
            }}>
            <Download size={14} />
            {exporting ? 'Exporting…' : 'Download backup now'}
          </button>

          {progress && (
            <div style={{ marginTop: '14px', fontSize: '12px', color: '#888' }}>
              Reading {progress.table}… ({progress.index} of {progress.total})
              <div style={{ height: '4px', background: '#ECEAE4', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${(progress.index / progress.total) * 100}%`, height: '100%', background: GOLD, transition: 'width 0.2s' }} />
              </div>
            </div>
          )}

          {result?.success && (
            <div style={{ marginTop: '16px', padding: '12px 14px', background: '#E1F5EE', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0F6E56', fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>
                <CheckCircle size={14} /> Export complete — {totalRows} rows across {TABLES.length} tables
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '3px 12px', fontSize: '11px', color: '#0F6E56' }}>
                {TABLES.map(t => (
                  <Fragment key={t}>
                    <span style={{ color: '#0F6E56' }}>{t}</span>
                    <span style={{ textAlign: 'right' }}>{result.counts[t]}</span>
                  </Fragment>
                ))}
              </div>
            </div>
          )}

          {result && !result.success && (
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px 14px', background: '#FAECE7', borderRadius: '8px', color: '#993C1D', fontSize: '13px' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>Export failed: {result.error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
