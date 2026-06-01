import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Send, ChevronDown, Users, User, Globe, Check } from 'lucide-react'

export default function MessageComposer({ projectId, members, onSent }) {
  const { profile } = useAuth()
  const [body, setBody] = useState('')
  const [recipientType, setRecipientType] = useState('everyone')
  const [recipientCompanyId, setRecipientCompanyId] = useState('')
  const [recipientCompanyName, setRecipientCompanyName] = useState('')
  const [recipientUserIds, setRecipientUserIds] = useState([])
  const [showOptions, setShowOptions] = useState(false)
  const [sending, setSending] = useState(false)

  // Derive unique companies directly from members who have a company assigned
  const memberCompanies = []
  const seenCompanyIds = new Set()
  members.forEach(m => {
    const companyId = m.profiles?.company_id
    const companyName = m.profiles?.companies?.name
    if (companyId && companyName && !seenCompanyIds.has(companyId)) {
      seenCompanyIds.add(companyId)
      memberCompanies.push({ id: companyId, name: companyName })
    }
  })

  // All members except current user
  const otherMembers = members.filter(m => m.user_id !== profile?.id)

  function toggleUserId(uid) {
    setRecipientUserIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    )
  }

  function selectEveryone() {
    setRecipientType('everyone')
    setRecipientCompanyId('')
    setRecipientCompanyName('')
    setRecipientUserIds([])
    setShowOptions(false)
  }

  function selectCompany(c) {
    setRecipientType('company')
    setRecipientCompanyId(c.id)
    setRecipientCompanyName(c.name)
    setRecipientUserIds([])
    setShowOptions(false)
  }

  function confirmIndividuals() {
    setRecipientType('individual')
    setShowOptions(false)
  }

  async function send() {
    if (!body.trim()) return
    if (recipientType === 'individual' && recipientUserIds.length === 0) return
    setSending(true)
    await supabase.from('project_messages').insert({
      project_id: projectId,
      user_id: profile.id,
      body: body.trim(),
      recipient_type: recipientType,
      recipient_company_id: recipientType === 'company' ? recipientCompanyId : null,
      recipient_user_ids: recipientType === 'individual' ? recipientUserIds : null
    })
    setBody('')
    setRecipientType('everyone')
    setRecipientCompanyId('')
    setRecipientCompanyName('')
    setRecipientUserIds([])
    setShowOptions(false)
    setSending(false)
    onSent()
  }

  function recipientLabel() {
    if (recipientType === 'everyone') return 'Everyone on this project'
    if (recipientType === 'company') return `${recipientCompanyName} (all members)`
    if (recipientType === 'individual') {
      if (recipientUserIds.length === 0) return 'Select people…'
      const names = otherMembers
        .filter(m => recipientUserIds.includes(m.user_id))
        .map(m => m.profiles?.full_name?.split(' ')[0])
      return names.join(', ')
    }
    return 'Everyone'
  }

  const canSend = body.trim() && !sending &&
    !(recipientType === 'individual' && recipientUserIds.length === 0)

  return (
    <div style={{ borderTop: '0.5px solid #ECEAE4', background: '#fff' }}>

      {/* Recipient selector row */}
      <div style={{ padding: '8px 16px 0', display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
        <span style={{ fontSize: '11px', color: '#aaa', flexShrink: 0 }}>To:</span>
        <button
          type="button"
          onClick={() => setShowOptions(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: '20px',
            border: '0.5px solid #D0CEC6', background: '#F7F6F3',
            fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
            color: '#1a1a1a', fontWeight: '500'
          }}>
          {recipientType === 'everyone' && <Globe size={12} color="#1B2B4B" />}
          {recipientType === 'company' && <Users size={12} color="#534AB7" />}
          {recipientType === 'individual' && <User size={12} color="#0F6E56" />}
          {recipientLabel()}
          <ChevronDown size={11} color="#aaa" />
        </button>

        {/* Dropdown panel */}
        {showOptions && (
          <>
            {/* Backdrop to close */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 40 }}
              onClick={() => setShowOptions(false)}
            />
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 6px)', left: '40px', zIndex: 50,
              background: '#fff', border: '0.5px solid #ECEAE4', borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: '280px', overflow: 'hidden'
            }}>
              <div style={{ padding: '8px 12px 4px', fontSize: '10px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '500' }}>
                Send to
              </div>

              {/* Everyone */}
              <OptionRow
                icon={<Globe size={15} color="#1B2B4B" />}
                label="Everyone"
                sublabel="All project members can see this"
                selected={recipientType === 'everyone'}
                onClick={selectEveryone}
              />

              {/* Companies */}
              {memberCompanies.length > 0 && (
                <>
                  <div style={{ padding: '8px 12px 4px', fontSize: '10px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '500', borderTop: '0.5px solid #F3F1EB' }}>
                    Company
                  </div>
                  {memberCompanies.map(c => (
                    <OptionRow
                      key={c.id}
                      icon={<Users size={15} color="#534AB7" />}
                      label={c.name}
                      sublabel="Visible to all members from this company"
                      selected={recipientType === 'company' && recipientCompanyId === c.id}
                      onClick={() => selectCompany(c)}
                    />
                  ))}
                </>
              )}

              {/* Individual members */}
              {otherMembers.length > 0 && (
                <>
                  <div style={{ padding: '8px 12px 4px', fontSize: '10px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '500', borderTop: '0.5px solid #F3F1EB' }}>
                    Individual
                  </div>
                  {otherMembers.map(m => {
                    const uid = m.user_id
                    const name = m.profiles?.full_name || 'Unknown'
                    const company = m.profiles?.companies?.name || m.consultant_type || ''
                    const init = m.profiles?.avatar_initials ||
                      name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                    const isSelected = recipientUserIds.includes(uid)
                    return (
                      <div
                        key={uid}
                        onClick={() => { setRecipientType('individual'); toggleUserId(uid) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 14px', cursor: 'pointer', fontSize: '13px',
                          background: isSelected ? '#F0F4FF' : 'transparent',
                          transition: 'background 0.1s'
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F7F6F3' }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
                        <div style={{
                          width: '26px', height: '26px', borderRadius: '50%',
                          background: isSelected ? '#1B2B4B' : '#EEEDFE',
                          color: isSelected ? '#B8952A' : '#534AB7',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: '700', flexShrink: 0
                        }}>{init}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '500', color: '#1a1a1a' }}>{name}</div>
                          {company && <div style={{ fontSize: '11px', color: '#aaa' }}>{company}</div>}
                        </div>
                        {isSelected && <Check size={14} color="#1B2B4B" />}
                      </div>
                    )
                  })}
                  {recipientType === 'individual' && recipientUserIds.length > 0 && (
                    <div style={{ padding: '8px 12px', borderTop: '0.5px solid #F3F1EB' }}>
                      <button
                        onClick={confirmIndividuals}
                        style={{
                          width: '100%', padding: '7px', background: '#1B2B4B',
                          color: '#fff', border: 'none', borderRadius: '8px',
                          fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}>
                        Done — {recipientUserIds.length} selected
                      </button>
                    </div>
                  )}
                </>
              )}

              {memberCompanies.length === 0 && otherMembers.length === 0 && (
                <div style={{ padding: '12px 14px', fontSize: '12px', color: '#aaa' }}>
                  Add team members to the project to enable targeted messaging.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Message input row */}
      <div style={{ padding: '8px 16px 12px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <textarea
          style={{
            flex: 1, padding: '9px 12px', border: '0.5px solid #D0CEC6',
            borderRadius: '10px', fontSize: '13px', outline: 'none',
            background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a',
            resize: 'none', minHeight: '42px', maxHeight: '120px', lineHeight: '1.5',
            boxSizing: 'border-box'
          }}
          placeholder={`Message ${recipientLabel()}…`}
          value={body}
          onChange={e => {
            setBody(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
          }}
          rows={1}
        />
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          style={{
            padding: '9px 14px', background: canSend ? '#1B2B4B' : '#ccc',
            color: '#fff', border: 'none', borderRadius: '10px',
            cursor: canSend ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '13px', flexShrink: 0, transition: 'background 0.15s'
          }}>
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}

function OptionRow({ icon, label, sublabel, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 14px', cursor: 'pointer',
        background: selected ? '#F0F4FF' : 'transparent',
        transition: 'background 0.1s'
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = '#F7F6F3' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = selected ? '#F0F4FF' : 'transparent' }}>
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{label}</div>
        {sublabel && <div style={{ fontSize: '11px', color: '#aaa', marginTop: '1px' }}>{sublabel}</div>}
      </div>
      {selected && <Check size={14} color="#1B2B4B" />}
    </div>
  )
}
