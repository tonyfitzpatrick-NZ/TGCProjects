import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, STAGE_COLORS } from '../lib/supabase'
import { format, isPast, differenceInDays, parseISO } from 'date-fns'
import { AlertTriangle, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react'

export default function DeadlinesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchDeadlines() {
      const { data } = await supabase
        .from('project_members')
        .select('*, projects(id, name, code, stage), profiles(full_name, avatar_initials)')
        .not('deadline', 'is', null)
        .order('deadline')
      setItems(data || [])
      setLoading(false)
    }
    fetchDeadlines()
  }, [])

  function dlInfo(deadline) {
    const d = parseISO(deadline)
    const days = differenceInDays(d, new Date())
    if (isPast(d) && days < 0) return { icon: AlertTriangle, color: '#A32D2D', bg: '#FAECE7', label: `Overdue · ${format(d, 'd MMM yyyy')}`, group: 'Overdue' }
    if (days <= 7) return { icon: AlertCircle, color: '#854F0B', bg: '#FAEEDA', label: `Due ${format(d, 'd MMM yyyy')} · ${days === 0 ? 'today' : `${days}d`}`, group: 'This week' }
    if (days <= 30) return { icon: AlertCircle, color: '#185FA5', bg: '#E6F1FB', label: format(d, 'd MMM yyyy'), group: 'This month' }
    return { icon: CheckCircle, color: '#1D9E75', bg: '#E1F5EE', label: format(d, 'd MMM yyyy'), group: 'Upcoming' }
  }

  const groups = ['Overdue', 'This week', 'This month', 'Upcoming']
  const grouped = groups.reduce((acc, g) => { acc[g] = []; return acc }, {})
  items.forEach(item => {
    const info = dlInfo(item.deadline)
    grouped[info.group].push({ ...item, dlInfo: info })
  })

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>Loading…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #ECEAE4', fontSize: '16px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
        Deadlines
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {groups.map(g => {
          const gItems = grouped[g]
          if (!gItems.length) return null
          return (
            <div key={g} style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: '500', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>{g}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {gItems.map(item => {
                  const { icon: Icon, color, bg, label } = item.dlInfo
                  const sc = STAGE_COLORS[item.projects?.stage] || { bg: '#F1EFE8', color: '#5F5E5A' }
                  const init = item.profiles?.avatar_initials ||
                    item.profiles?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
                  return (
                    <div key={item.id}
                      onClick={() => navigate(`/projects/${item.projects?.id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', border: '0.5px solid #ECEAE4', borderRadius: '10px', background: '#fff', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EEEDFE', color: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', flexShrink: 0 }}>{init}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '500', fontSize: '13px', color: '#1a1a1a' }}>{item.profiles?.full_name}</div>
                        <div style={{ fontSize: '12px', color: '#aaa' }}>{item.consultant_type} · {item.projects?.name}</div>
                      </div>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: sc.bg, color: sc.color, fontWeight: '500', flexShrink: 0 }}>{item.projects?.stage}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color, fontSize: '12px', fontWeight: '500', flexShrink: 0 }}>
                        <Icon size={13} />
                        {label}
                      </div>
                      <ChevronRight size={14} color="#ccc" />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        {items.length === 0 && (
          <div style={{ textAlign: 'center', color: '#ccc', padding: '60px', fontSize: '14px' }}>No deadlines set yet.</div>
        )}
      </div>
    </div>
  )
}
