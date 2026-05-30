import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import logo from '../lib/logo'
import {
  LayoutGrid, Clock, Bell, FolderOpen, Upload,
  Users, Settings, LogOut, CheckSquare
} from 'lucide-react'

const NAVY = '#1B2B4B'
const GOLD = '#B8952A'

export default function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isAdmin = profile?.role === 'admin'
  const isLead = isAdmin || profile?.role === 'project_lead'
  const initials = profile?.avatar_initials ||
    profile?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'

  function NavItem({ icon: Icon, label, path }) {
    const active = location.pathname === path
    return (
      <div onClick={() => navigate(path)} style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '7px 10px', borderRadius: '7px', cursor: 'pointer',
        fontSize: '13px', margin: '1px 6px',
        background: active ? 'rgba(184,149,42,0.15)' : 'transparent',
        color: active ? GOLD : 'rgba(255,255,255,0.65)',
        fontWeight: active ? '500' : '400',
        transition: 'all 0.1s'
      }}
        onMouseEnter={e => { e.currentTarget.style.background = active ? 'rgba(184,149,42,0.15)' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = active ? GOLD : 'rgba(255,255,255,0.9)' }}
        onMouseLeave={e => { e.currentTarget.style.background = active ? 'rgba(184,149,42,0.15)' : 'transparent'; e.currentTarget.style.color = active ? GOLD : 'rgba(255,255,255,0.65)' }}
      >
        <Icon size={15} strokeWidth={1.8} />
        {label}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", background: '#F7F6F3' }}>
      {/* Sidebar */}
      <div style={{ width: '210px', flexShrink: 0, background: NAVY, display: 'flex', flexDirection: 'column' }}>

        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <img src={logo} alt="TGC Homes" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} />
          <div style={{ fontSize: '11px', color: GOLD, marginTop: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: '500' }}>
            Project Portal
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, paddingTop: '8px', overflowY: 'auto' }}>
          <SectionLabel>Workspace</SectionLabel>
          <NavItem icon={LayoutGrid} label="All Projects" path="/" />
          <NavItem icon={CheckSquare} label="Tasks" path="/tasks" />
          <NavItem icon={Clock} label="Deadlines" path="/deadlines" />
          <NavItem icon={Bell} label="Notifications" path="/notifications" />

          <SectionLabel>Files</SectionLabel>
          <NavItem icon={FolderOpen} label="OneDrive" path="/onedrive" />
          <NavItem icon={Upload} label="Shared Uploads" path="/uploads" />

          {(isAdmin || isLead) && <>
            <SectionLabel>Admin</SectionLabel>
            <NavItem icon={Users} label="Users & Access" path="/admin/users" />
            <NavItem icon={Settings} label="Settings" path="/admin/settings" />
          </>}
        </div>

        {/* User footer */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: GOLD, color: NAVY,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '700', flexShrink: 0
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.full_name}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
                {profile?.role?.replace('_', ' ')}
              </div>
            </div>
            <div onClick={signOut} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px' }} title="Sign out">
              <LogOut size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      padding: '10px 14px 4px', fontSize: '10px', textTransform: 'uppercase',
      letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', fontWeight: '500'
    }}>{children}</div>
  )
}
