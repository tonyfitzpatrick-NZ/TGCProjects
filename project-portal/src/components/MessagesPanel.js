import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, ChevronRight, ChevronLeft, Send, Globe, Users, User, Check, CheckCircle, Archive, RefreshCw, MessageSquare, ChevronDown } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { Modal } from './NewProjectModal'

const THREAD_STATUSES = ['Open', 'Resolved', 'Archived']

const THREAD_STATUS_COLORS = {
  'Open':     { bg: '#E1F5EE', color: '#0F6E56' },
  'Resolved': { bg: '#EEEDFE', color: '#534AB7' },
  'Archived': { bg: '#F0EFEF', color: '#999' }
}

export default function MessagesPanel({ projectId, members, isLead }) {
  const { profile } = useAuth()
  const [threads, setThreads] = useState([])
  const [activeThread, setActiveThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('Open')
  const [showNew, setShowNew] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const msgEnd = useRef(null)

  useEffect(() => { fetchThreads() }, [projectId])

  useEffect(() => {
    if (!activeThread) return
    fetchMessages(activeThread.id)

    // Realtime subscription for new messages in this thread
    const sub = supabase.channel(`thread-${activeThread.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'project_messages',
        filter: `thread_id=eq.${activeThread.id}`
      }, payload => {
        setMessages(prev => [...prev, payload.new])
        // Refetch to get profile data on new message
        fetchMessages(activeThread.id)
      })
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [activeThread?.id])

  useEffect(() => {
    msgEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchThreads() {
    setLoading(true)
    const { data } = await supabase
      .from('message_threads')
      .select('*, created_by_profile:profiles(full_name, avatar_initials), last_message:project_messages(body, created_at, profiles(full_name))')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })
    // Get reply counts
    const threadIds = (data || []).map(t => t.id)
    let countMap = {}
    if (threadIds.length > 0) {
      const { data: counts } = await supabase
        .from('project_messages')
        .select('thread_id')
        .in('thread_id', threadIds)
      counts?.forEach(c => { countMap[c.thread_id] = (countMap[c.thread_id] || 0) + 1 })
    }
    setThreads((data || []).map(t => ({ ...t, replyCount: countMap[t.id] || 0 })))
    setLoading(false)
  }

  async function fetchMessages(threadId) {
    setMsgLoading(true)
    const { data } = await supabase
      .from('project_messages')
      .select('*, profiles(full_name, avatar_initials)')
      .eq('thread_id', threadId)
      .order('created_at')
    setMessages(data || [])
    setMsgLoading(false)
  }

  async function sendReply() {
    if (!replyText.trim() || !activeThread) return
    setSending(true)
    await supabase.from('project_messages').insert({
      project_id: projectId,
      thread_id: activeThread.id,
      user_id: profile.id,
      body: replyText.trim(),
      recipient_type: activeThread.recipient_type,
      recipient_company_id: activeThread.recipient_company_id,
      recipient_user_ids: activeThread.recipient_user_ids
    })
    // Update thread updated_at
    await supabase.from('message_threads').update({ updated_at: new Date().toISOString() }).eq('id', activeThread.id)
    setReplyText('')
    setSending(false)
    fetchMessages(activeThread.id)
    fetchThreads()
  }

  async function updateThreadStatus(threadId, status) {
    await supabase.from('message_threads').update({ status }).eq('id', threadId)
    setActiveThread(prev => prev ? { ...prev, status } : null)
    fetchThreads()
  }

  function openThread(thread) {
    setActiveThread(thread)
    setReplyText('')
  }

  function goBack() {
    setActiveThread(null)
    fetchThreads()
  }

  // Derive member companies for recipient picker
  const memberCompanies = []
  const seenIds = new Set()
  members.forEach(m => {
    const id = m.profiles?.company_id
    const name = m.profiles?.companies?.name
    if (id && name && !seenIds.has(id)) { seenIds.add(id); memberCompanies.push({ id, name }) }
  })
  const otherMembers = members.filter(m => m.user_id !== profile?.id)

  const visibleThreads = threads.filter(t =>
    filterStatus === 'All' || t.status === filterStatus
  )

  // ── THREAD DETAIL VIEW ───────────────────────────────────────
  if (activeThread) {
    const sc = THREAD_STATUS_COLORS[activeThread.status] || THREAD_STATUS_COLORS['Open']
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Thread header */}
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #ECEAE4', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={goBack} style={S.iconBtn} title="Back to threads">
              <ChevronLeft size={16} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
                {activeThread.subject}
              </div>
              <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RecipientIcon type={activeThread.recipient_type} />
                <span>{recipientLabel(activeThread, memberCompanies, otherMembers)}</span>
                <span>·</span>
                <span>{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            {/* Status badge + changer */}
            <div style={{ position: 'relative' }}>
              <StatusMenu
                status={activeThread.status}
                canChange={isLead || activeThread.created_by === profile?.id}
                onChange={s => updateThreadStatus(activeThread.id, s)}
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {msgLoading ? (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>Loading…</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#ccc', padding: '40px' }}>No messages yet — send the first reply below.</div>
          ) : messages.map((m, i) => {
            const isMe = m.user_id === profile?.id
            const init = m.profiles?.avatar_initials ||
              m.profiles?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
            const showAvatar = i === 0 || messages[i - 1]?.user_id !== m.user_id
            return (
              <div key={m.id} style={{ display: 'flex', gap: '10px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: isMe ? '#EEEDFE' : '#E1F5EE',
                  color: isMe ? '#534AB7' : '#0F6E56',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: '600',
                  visibility: showAvatar ? 'visible' : 'hidden'
                }}>{init}</div>
                <div style={{ maxWidth: '72%' }}>
                  {showAvatar && (
                    <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px', textAlign: isMe ? 'right' : 'left' }}>
                      {isMe ? 'You' : m.profiles?.full_name} · {format(new Date(m.created_at), 'd MMM, h:mm a')}
                    </div>
                  )}
                  <div style={{
                    background: isMe ? '#EEEDFE' : '#F3F1EB',
                    padding: '10px 14px',
                    borderRadius: isMe ? '14px 2px 14px 14px' : '2px 14px 14px 14px',
                    fontSize: '13px', color: '#1a1a1a', lineHeight: '1.6',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                  }}>{m.body}</div>
                </div>
              </div>
            )
          })}
          <div ref={msgEnd} />
        </div>

        {/* Reply composer */}
        {activeThread.status !== 'Archived' ? (
          <div style={{ borderTop: '0.5px solid #ECEAE4', padding: '10px 16px 12px', background: '#fff', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea
              style={{
                flex: 1, padding: '9px 12px', border: '0.5px solid #D0CEC6',
                borderRadius: '10px', fontSize: '13px', outline: 'none',
                background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a',
                resize: 'none', minHeight: '42px', maxHeight: '120px', lineHeight: '1.5',
                boxSizing: 'border-box'
              }}
              placeholder={`Reply to "${activeThread.subject}"… (Enter to send, Shift+Enter for new line)`}
              value={replyText}
              onChange={e => {
                setReplyText(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
              rows={1}
              autoFocus
            />
            <button onClick={sendReply} disabled={!replyText.trim() || sending}
              style={{
                padding: '9px 14px', background: replyText.trim() ? '#1B2B4B' : '#ccc',
                color: '#fff', border: 'none', borderRadius: '10px', cursor: replyText.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, transition: 'background 0.15s'
              }}>
              <Send size={14} />
            </button>
          </div>
        ) : (
          <div style={{ padding: '12px 16px', background: '#F7F6F3', borderTop: '0.5px solid #ECEAE4', textAlign: 'center', fontSize: '12px', color: '#aaa' }}>
            This thread is archived. Change the status to reply.
          </div>
        )}
      </div>
    )
  }

  // ── THREAD LIST VIEW ─────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>Messages</div>
        {/* Status filter chips */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {['Open', 'Resolved', 'Archived', 'All'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer',
              fontFamily: 'inherit', border: '0.5px solid #D0CEC6',
              background: filterStatus === s ? '#1B2B4B' : 'transparent',
              color: filterStatus === s ? '#fff' : '#666',
              transition: 'all 0.1s'
            }}>{s}</button>
          ))}
        </div>
        <button onClick={() => setShowNew(true)} style={S.btnPrimary}>
          <Plus size={13} /> New thread
        </button>
      </div>

      {/* Thread list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>Loading…</div>
        ) : visibleThreads.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#ccc', padding: '40px', fontSize: '13px' }}>
            {filterStatus === 'Open' ? 'No open threads. Click "New thread" to start a conversation.' : `No ${filterStatus.toLowerCase()} threads.`}
          </div>
        ) : visibleThreads.map(thread => {
          const sc = THREAD_STATUS_COLORS[thread.status] || THREAD_STATUS_COLORS['Open']
          const lastMsg = thread.last_message?.[0]
          return (
            <div key={thread.id} onClick={() => openThread(thread)}
              style={{ padding: '14px 16px', borderBottom: '0.5px solid #F3F1EB', cursor: 'pointer', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <MessageSquare size={16} color={sc.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {thread.subject}
                    </span>
                    <span style={{ fontSize: '11px', color: '#bbb', flexShrink: 0 }}>
                      {formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ ...S.badge, background: sc.bg, color: sc.color }}>{thread.status}</span>
                    <RecipientBadge type={thread.recipient_type} companyName={memberCompanies.find(c => c.id === thread.recipient_company_id)?.name} />
                    <span style={{ fontSize: '11px', color: '#bbb' }}>{thread.replyCount} message{thread.replyCount !== 1 ? 's' : ''}</span>
                  </div>
                  {lastMsg && (
                    <div style={{ fontSize: '12px', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ fontWeight: '500' }}>{lastMsg.profiles?.full_name?.split(' ')[0]}: </span>
                      {lastMsg.body}
                    </div>
                  )}
                </div>
                <ChevronRight size={14} color="#ccc" style={{ flexShrink: 0, marginTop: '2px' }} />
              </div>
            </div>
          )
        })}
      </div>

      {showNew && (
        <NewThreadModal
          projectId={projectId}
          memberCompanies={memberCompanies}
          otherMembers={otherMembers}
          profile={profile}
          onClose={() => setShowNew(false)}
          onCreated={fetchThreads}
        />
      )}
    </div>
  )
}

// ── NEW THREAD MODAL ──────────────────────────────────────────
function NewThreadModal({ projectId, memberCompanies, otherMembers, profile, onClose, onCreated }) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [recipientType, setRecipientType] = useState('everyone')
  const [recipientCompanyId, setRecipientCompanyId] = useState('')
  const [recipientUserIds, setRecipientUserIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleUser(uid) {
    setRecipientUserIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!subject.trim()) { setError('A subject is required.'); return }
    if (!body.trim()) { setError('Please write an opening message.'); return }
    if (recipientType === 'individual' && recipientUserIds.length === 0) { setError('Please select at least one recipient.'); return }
    setLoading(true); setError('')

    const { data: thread, error: threadErr } = await supabase
      .from('message_threads')
      .insert({
        project_id: projectId,
        subject: subject.trim(),
        status: 'Open',
        recipient_type: recipientType,
        recipient_company_id: recipientType === 'company' ? recipientCompanyId : null,
        recipient_user_ids: recipientType === 'individual' ? recipientUserIds : null,
        created_by: profile.id
      })
      .select().single()

    if (threadErr || !thread) { setError(threadErr?.message || 'Failed to create thread.'); setLoading(false); return }

    await supabase.from('project_messages').insert({
      project_id: projectId,
      thread_id: thread.id,
      user_id: profile.id,
      body: body.trim(),
      recipient_type: recipientType,
      recipient_company_id: thread.recipient_company_id,
      recipient_user_ids: thread.recipient_user_ids
    })

    onCreated(); onClose()
  }

  return (
    <Modal title="New message thread" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="Subject *">
          <input
            style={S.input}
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Structural drawings review, Site meeting notes, Issue with consent drawings…"
            required
            autoFocus
          />
        </Field>

        {/* Recipient selector */}
        <Field label="Visible to">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', border: '0.5px solid #D0CEC6', borderRadius: '8px', background: '#FAFAF8' }}>
            {/* Everyone */}
            <RecipientOption
              icon={<Globe size={14} color="#1B2B4B" />}
              label="Everyone on this project"
              selected={recipientType === 'everyone'}
              onClick={() => setRecipientType('everyone')}
            />
            {/* Companies */}
            {memberCompanies.map(c => (
              <RecipientOption
                key={c.id}
                icon={<Users size={14} color="#534AB7" />}
                label={`${c.name} only`}
                selected={recipientType === 'company' && recipientCompanyId === c.id}
                onClick={() => { setRecipientType('company'); setRecipientCompanyId(c.id) }}
              />
            ))}
            {/* Individual toggle */}
            <RecipientOption
              icon={<User size={14} color="#0F6E56" />}
              label="Specific people"
              selected={recipientType === 'individual'}
              onClick={() => setRecipientType('individual')}
            />
            {/* Individual checkboxes */}
            {recipientType === 'individual' && otherMembers.length > 0 && (
              <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {otherMembers.map(m => {
                  const uid = m.user_id
                  const name = m.profiles?.full_name || 'Unknown'
                  const co = m.profiles?.companies?.name || m.consultant_type || ''
                  const isSelected = recipientUserIds.includes(uid)
                  return (
                    <div key={uid} onClick={() => toggleUser(uid)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', background: isSelected ? '#F0F4FF' : 'transparent' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '3px', border: `1.5px solid ${isSelected ? '#1B2B4B' : '#D0CEC6'}`, background: isSelected ? '#1B2B4B' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isSelected && <Check size={10} color="#B8952A" />}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a' }}>{name}</span>
                      {co && <span style={{ fontSize: '11px', color: '#aaa' }}>— {co}</span>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Field>

        <Field label="Opening message *">
          <textarea
            style={{ ...S.input, minHeight: '100px', resize: 'vertical', lineHeight: '1.6' }}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write your opening message…"
            required
          />
        </Field>

        {error && <div style={S.error}>{error}</div>}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
          <button type="submit" style={S.btnPrimary} disabled={loading}>
            {loading ? 'Creating…' : 'Start thread'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── STATUS MENU ───────────────────────────────────────────────
function StatusMenu({ status, canChange, onChange }) {
  const [open, setOpen] = useState(false)
  const sc = THREAD_STATUS_COLORS[status] || THREAD_STATUS_COLORS['Open']
  const icons = { Open: RefreshCw, Resolved: CheckCircle, Archived: Archive }

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => canChange && setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '4px 10px', borderRadius: '20px',
          background: sc.bg, color: sc.color,
          fontSize: '12px', fontWeight: '500',
          cursor: canChange ? 'pointer' : 'default',
          userSelect: 'none'
        }}>
        {status}
        {canChange && <ChevronDown size={11} />}
      </div>
      {open && canChange && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 50, background: '#fff', border: '0.5px solid #ECEAE4', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: '160px', overflow: 'hidden' }}>
            {THREAD_STATUSES.map(s => {
              const ssc = THREAD_STATUS_COLORS[s]
              const Icon = icons[s]
              return (
                <div key={s} onClick={() => { onChange(s); setOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', cursor: 'pointer', background: s === status ? ssc.bg : 'transparent', fontSize: '13px', fontWeight: s === status ? '500' : '400' }}
                  onMouseEnter={e => e.currentTarget.style.background = ssc.bg}
                  onMouseLeave={e => e.currentTarget.style.background = s === status ? ssc.bg : 'transparent'}>
                  <Icon size={13} color={ssc.color} />
                  <span style={{ color: ssc.color }}>{s}</span>
                  {s === status && <Check size={12} color={ssc.color} style={{ marginLeft: 'auto' }} />}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── HELPERS ───────────────────────────────────────────────────
function recipientLabel(thread, companies, members) {
  if (thread.recipient_type === 'company') {
    const co = companies.find(c => c.id === thread.recipient_company_id)
    return co ? `${co.name} only` : 'Company'
  }
  if (thread.recipient_type === 'individual') {
    const ids = thread.recipient_user_ids || []
    if (ids.length === 0) return 'Specific people'
    const names = members.filter(m => ids.includes(m.user_id)).map(m => m.profiles?.full_name?.split(' ')[0])
    return names.join(', ') || 'Specific people'
  }
  return 'Everyone on this project'
}

function RecipientIcon({ type }) {
  if (type === 'company') return <Users size={11} />
  if (type === 'individual') return <User size={11} />
  return <Globe size={11} />
}

function RecipientBadge({ type, companyName }) {
  if (type === 'everyone') return null
  const label = type === 'company' ? (companyName || 'Company') : 'Direct'
  return <span style={{ fontSize: '10px', background: '#FAEEDA', color: '#854F0B', padding: '1px 6px', borderRadius: '10px', fontWeight: '500' }}>{label}</span>
}

function RecipientOption({ icon, label, selected, onClick }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', background: selected ? '#F0F4FF' : 'transparent', transition: 'background 0.1s' }}>
      {icon}
      <span style={{ fontSize: '13px', color: '#1a1a1a', flex: 1 }}>{label}</span>
      {selected && <Check size={13} color="#1B2B4B" />}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>{label}</label>
      {children}
    </div>
  )
}

const S = {
  input: { padding: '8px 10px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '100%', boxSizing: 'border-box' },
  error: { background: '#FAECE7', color: '#993C1D', fontSize: '13px', padding: '10px 12px', borderRadius: '8px' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  btnSec: { padding: '8px 18px', background: 'transparent', color: '#666', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
  iconBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px', border: '0.5px solid #E0DED6', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: '#666' },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500' }
}
