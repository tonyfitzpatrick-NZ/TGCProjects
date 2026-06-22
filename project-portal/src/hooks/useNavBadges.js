// ============================================================
// src/hooks/useNavBadges.js
// Tracks whether the Messages and Tasks nav items should show
// a "new activity" badge, and lets pages mark an area as seen.
//
// Relies on RLS already scoping tasks/project_messages to only
// what the current user can access (via project_members or
// their company's project_company_access) — so this hook can
// just ask "what's the latest activity timestamp?" and Postgres
// does the access filtering for free; no need to duplicate that
// logic here.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useNavBadges(userId) {
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const [hasNewTasks,    setHasNewTasks]    = useState(false)

  const check = useCallback(async () => {
    if (!userId) return
    try {
      const [seenRes, latestMsgRes, latestTaskRes] = await Promise.all([
        supabase.from('user_nav_seen').select('area, last_seen_at').eq('user_id', userId),
        supabase.from('project_messages').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('tasks').select('updated_at, created_at').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      ])

      const seenMap = {}
      ;(seenRes.data || []).forEach(r => { seenMap[r.area] = r.last_seen_at })

      const latestMessageAt = latestMsgRes.data?.created_at || null
      const latestTaskAt = latestTaskRes.data
        ? (latestTaskRes.data.updated_at || latestTaskRes.data.created_at)
        : null

      setHasNewMessages(isNewerThan(latestMessageAt, seenMap.messages))
      setHasNewTasks(isNewerThan(latestTaskAt, seenMap.tasks))
    } catch (e) {
      // Badge checks are non-critical UI sugar — fail quietly
      // rather than disrupting navigation if this errors.
      console.error('useNavBadges check error:', e)
    }
  }, [userId])

  useEffect(() => { check() }, [check])

  // Re-check periodically so badges appear even if the user
  // doesn't navigate anywhere (e.g. leaves the tab open).
  useEffect(() => {
    const interval = setInterval(check, 60_000)
    return () => clearInterval(interval)
  }, [check])

  const markSeen = useCallback(async (area) => {
    if (!userId) return
    try {
      await supabase.from('user_nav_seen').upsert(
        { user_id: userId, area, last_seen_at: new Date().toISOString() },
        { onConflict: 'user_id,area' }
      )
      if (area === 'messages') setHasNewMessages(false)
      if (area === 'tasks') setHasNewTasks(false)
    } catch (e) {
      console.error('markSeen error:', e)
    }
  }, [userId])

  return { hasNewMessages, hasNewTasks, markSeen, recheck: check }
}

function isNewerThan(latestAt, seenAt) {
  if (!latestAt) return false
  if (!seenAt) return true
  return new Date(latestAt) > new Date(seenAt)
}
