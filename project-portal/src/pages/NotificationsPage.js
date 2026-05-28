import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { MessageSquare, Upload, UserPlus, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

export default function NotificationsPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchActivity() }, [])

  async function fetchActivity() {
    setLoading(true)
    const [msgRes, fileRes] = await Promise.all([
      supabase.from('project_messages')
        .select('*, profiles(full_name), projects(id, name, code)')
        .neq('user_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase.from('project_files')
        .select('*, profiles(full_name), projects(id, name, code)')
        .order('created_at', { ascending: false })
        .limit(30)
    ])
    setMessages(msgRes.data || [])
    setFiles(fileRes.data || [])
    setLoading(false)
  }

  // Merge and sort by date
  const activity = [
    ...(messages.map(m => ({ ...m, type: 'message' }))),
    ...(files.map(f => ({ ...f, type: 'file' }))),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 40)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={S.topbar}>
        <div style={S.title}>Notifications</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading ? (
          <div style={S.empty}>Loading activity…</div>
        ) : activity.length === 0 ? (
          <div style={S.empty}>No recent activity across your projects.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {activity.map(item => {
              const isMsg = item.type === 'message'
              const Icon = isMsg ? MessageSquare : Upload
              const iconBg = isMsg ? '#EEEDFE' : '#E1F5EE'
              const iconColor = isMsg ? '#534AB7' : '#0F6E56'
              return (
                <div key={`${item.type}-${item.id}`}
                  onClick={() => navigate(`/projects/${item.projects?.id}`)}
                  style={S.row}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <div style={{ ...S.iconWrap, background: iconBg }}>
                    <Icon size={14} color={iconColor} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: '#1a1a1a' }}>
                      <span style={{ fontWeight: '500' }}>{item.profiles?.full_name}</span>
                      {isMsg ? ' sent a message in ' : ' uploaded a file to '}
                      <span style={{ fontWeight: '500' }}>{item.projects?.name}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {isMsg ? item.body : item.name}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#bbb', flexShrink: 0 }}>
                    {format(new Date(item.created_at), 'd MMM, h:mm a')}
                  </div>
                  <ChevronRight size={14} color="#ccc" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const S = {
  topbar: { padding: '14px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', alignItems: 'center' },
  title: { fontSize: '16px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em' },
  empty: { textAlign: 'center', color: '#ccc', padding: '60px', fontSize: '14px' },
  row: { display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', border: '0.5px solid #ECEAE4', borderRadius: '10px', background: '#fff', cursor: 'pointer', transition: 'background 0.1s' },
  iconWrap: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
}
