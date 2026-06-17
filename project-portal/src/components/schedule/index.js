// ============================================================
// src/components/schedule/index.js — Schedule module exports
// Import from here in your project detail / admin pages:
//   import { ScheduleTab, ScheduleAdminPanel } from '../components/schedule'
//
// FIX: removed exports for ScheduleSection and ScheduleItem —
// both are obsolete now that ScheduleTab.jsx renders items
// inline using the new schema. Keeping the export would let
// stale files get pulled into the build by mistake.
// ============================================================

export { default as ScheduleTab }        from './ScheduleTab'
export { default as ScheduleAdminPanel } from './ScheduleAdminPanel'
