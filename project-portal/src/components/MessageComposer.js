import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Send, ChevronDown, Users, User, Globe } from 'lucide-react'

export default function MessageComposer({ projectId, members, companies, onSent }) {
  const { profile } = useAuth()
  const [body, setBody] = useState('')
  const [recipientType, setRecipientType] = useState('everyone')
  const [recipientCompanyId, setRecipientCompanyId] = useState('')
  const [recipientUserIds, setRecipientUserIds] = useState([])
  const [showOptions, setShowOptions] = useState(false)
  const [sending, setSending] = useState(false)

  // Get unique companies from project members
  const memberCompanies = companies.filter(c =>
    members.some(m => m.profiles?.company_id === c.id)
  )

  // Get individual members (excluding self)
  const otherMembers = members.filter(m => m.user_id !== profile?.id)

  function toggleUserId(uid) {
    setRecipientUserIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    )
  }

  async function send() {
    if (!body.trim()) return
    setSending(true)
    await supabase.from('project_messages').insert({
      project_id: projectId,
      user_id: profile.id,
      body: body.trim(),
      recipient_type: recipientType,
      recipient_company_id: recipientType === 'company' ? recipientCompanyId || null : null,
      recipient_user_ids: recipientType === 'individual' ? recipientUserIds : null
    })
    setBody('')
    setRecipientType('everyone')
    setRecipientCompanyId('')
    setRecipientUserIds([])
    setShowOptions(false)
    setSending(false)
    onSent()
  }

  function recipientLabel() {
    if (recipientType === 'everyone') return 'Everyone on this project'
    if (recipientType === 'company') {
      const co = memberCompanies.find(c => c.id === recipientCompanyId)
      return co ? `${co.name} (all members)` : 'Select a company…'
    }
    if (recipientType === 'individual') {
      if (recipientUserIds.length === 0) return 'Select recipients…'
      const names = otherMembers
        .filter(m => recipientUserIds.includes(m.user_id))
        .map(m => m.profiles?.full_name?.split(' ')[0])
      return names.join(', ')
    }
    return 'Everyone'
  }

  const recipientIcon = recipientType === 'everyone'
    ? <Globe size={13} />
    : recipientType === 'company'
    ? <Users size={13} />
    : <User size={13} />

  return (
    <div style={{ borderTop: '0.5px solid #ECEAE4', background: '#fff' }}>
      {/* Recipient selector */}
      <div style={{ padding: '8px 16px 0', display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
        <span style={{ fontSize: '11px', color: '#aaa' }}>To:</span>
        <button
          onClick={() => setShowOptions(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', borderRadius: '20px', border: '0.5px solid #D0CEC6',
            background: '#F7F6F3', fontSize: '12px', cursor: 'pointer',
            fontFamily: 'inherit', color: '#444'
          }}>
          {recipientIcon}
          {recipientLabel()}
          <ChevronDown size={11} />
        </button>

        {/* Dropdown */}
        {showOptions && (
          <div style={{
            position: 'absolute', top: '100%', left: '40px', zIndex: 50,
            background: '#fff', border: '0.5px solid #ECEAE4', borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: '260px', marginTop: '4px'
          }}>
            {/* Everyone */}
            <div
              onClick={() => { setRecipientType('everyone'); setShowOptions(false) }}
              style={optionStyle(recipientType === 'everyone')}>
              <Globe size={14} color="#1B2B4B" />
              <div>
                <div style={{ fontWeight: '500' }}>Everyone</div>
                <div style={{ fontSize: '11px', color: '#aaa' }}>All project members can see this</div>
              </div>
            </div>

            {/* Company */}
            {memberCompanies.length > 0 && (
              <>
                <div style={{ padding: '4px 12px', fontSize: '10px', color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Company</div>
                {memberCompanies.map(c => (
                  <div key={c.id}
                    onClick={() => { setRecipientType('company'); setRecipientCompanyId(c.id); setShowOptions(false) }}
                    style={optionStyle(recipientType === 'company' && recipientCompanyId === c.id)}>
                    <Users size={14} color="#534AB7" />
                    <div>
                      <div style={{ fontWeight: '500' }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: '#aaa' }}>Visible to all {c.name} members on this project</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Individual */}
            {otherMembers.length > 0 && (
              <>
                <div style={{ padding: '4px 12px', fontSize: '10px', color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Individual</div>
                {otherMembers.map(m => {
                  const selected = recipientUserIds.includes(m.user_id)
                  const init = m.profiles?.avatar_initials ||
                    m.profiles?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
                  return (
                    <div key={m.user_id}
                      onClick={() => { setRecipientType('individual'); toggleUserId(m.user_id) }}
                      style={optionStyle(selected)}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: selected ? '#1B2B4B' : '#EEEDFE', color: selected ? '#B8952A' : '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', flexShrink: 0 }}>{init}</div>
                      <div>
                        <div style={{ fontWeight: '500' }}>{m.profiles?.full_name}</div>
                        <div style={{ fontSize: '11px', color: '#aaa' }}>{m.consultant_type || m.profiles?.companies?.name || ''}</div>
                      </div>
                      {selected && <div style={{ marginLeft: 'auto', color: '#1B2B4B', fontSize: '16px', flexShrink: 0 }}>✓</div>}
                    </div>
                  )
                })}
                {recipientType === 'individual' && recipientUserIds.length > 0 && (
                  <div style={{ padding: '8px 12px', borderTop: '0.5px solid #F0EEE9' }}>
                    <button onClick={() => setShowOptions(false)} style={{ width: '100%', padding: '6px', background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Done — {recipientUserIds.length} selected
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Message input */}
      <div style={{ padding: '8px 16px 12px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <textarea
          style={{
            flex: 1, padding: '9px 12px', border: '0.5px solid #D0CEC6',
            borderRadius: '10px', fontSize: '13px', outline: 'none',
            background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a',
            resize: 'none', minHeight: '40px', maxHeight: '120px', lineHeight: '1.5'
          }}
          placeholder={`Message ${recipientLabel()}…`}
          value={body}
          onChange={e => { setBody(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          rows={1}
        />
        <button
          onClick={send}
          disabled={!body.trim() || sending || (recipientType === 'individual' && recipientUserIds.length === 0)}
          style={{
            padding: '9px 14px', background: '#1B2B4B', color: '#fff',
            border: 'none', borderRadius: '10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px',
            opacity: (!body.trim() || sending) ? 0.5 : 1
          }}>
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}

function optionStyle(selected) {
  return {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', cursor: 'pointer', fontSize: '13px',
    background: selected ? '#F0EEF8' : 'transparent',
    transition: 'background 0.1s',
    onMouseEnter: e => e.currentTarget.style.background = '#F7F6F3'
  }
}
