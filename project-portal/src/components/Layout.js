import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutGrid, Clock, Bell, FolderOpen, Upload, Users, Settings,
  LogOut, ChevronRight, X, Menu
} from 'lucide-react'

const NAV = [
  { label: 'All Projects', icon: LayoutGrid, path: '/' },
  { label: 'Deadlines', icon: Clock, path: '/deadlines' },
  { label: 'Notifications', icon: Bell, path: '/notifications' },
]
const NAV2 = [
  { label: 'Shared Uploads', icon: Upload, path: '/uploads' },
]
const NAV3_ADMIN = [
  { label: 'Users & Access', icon: Users, path: '/admin/users' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
]

export default function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin = profile?.role === 'admin'
  const isLead = profile?.role === 'project_lead' || isAdmin
  const initials = profile?.avatar_initials ||
    profile?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'

  function go(path) { navigate(path); setMobileOpen(false) }

  function NavItem({ icon: Icon, label, path }) {
    const active = location.pathname === path
    return (
      <div onClick={() => go(path)} style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '7px 10px', borderRadius: '7px', cursor: 'pointer',
        fontSize: '13px', margin: '1px 6px',
        background: active ? '#fff' : 'transparent',
        color: active ? '#1a1a1a' : '#666',
        fontWeight: active ? '500' : '400',
        boxShadow: active ? '0 0.5px 2px rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.1s'
      }}>
        <Icon size={15} strokeWidth={1.8} />
        {label}
      </div>
    )
  }

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 14px', borderBottom: '0.5px solid #ECEAE4' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
            {[[0,'#534AB7'],[1,'#AFA9EC'],[2,'#AFA9EC'],[3,'#534AB7']].map(([i,c]) => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: 1.5, background: c, opacity: i%2===0?1:0.6 }} />
            ))}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em' }}>Project Portal</div>
            <div style={{ fontSize: '11px', color: '#aaa' }}>Meridian Developments</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, paddingTop: '8px', overflowY: 'auto' }}>
        <SectionLabel>Workspace</SectionLabel>
        {NAV.map(n => <NavItem key={n.path} {...n} />)}
        <SectionLabel>Files</SectionLabel>
        <NavItem icon={FolderOpen} label="OneDrive" path="/onedrive" />
        {NAV2.map(n => <NavItem key={n.path} {...n} />)}
        {isAdmin && <>
          <SectionLabel>Admin</SectionLabel>
          {NAV3_ADMIN.map(n => <NavItem key={n.path} {...n} />)}
        </>}
      </div>

      <div style={{ padding: '12px', borderTop: '0.5px solid #ECEAE4' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%', background: '#EEEDFE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: '600', color: '#534AB7', flexShrink: 0
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.full_name}
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', textTransform: 'capitalize' }}>{profile?.role?.replace('_', ' ')}</div>
          </div>
          <div onClick={signOut} style={{ cursor: 'pointer', color: '#bbb', padding: '4px' }} title="Sign out">
            <LogOut size={14} />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", background: '#F7F6F3' }}>
      {/* Desktop sidebar */}
      <div style={{
        width: '210px', flexShrink: 0, background: '#F0EEE9',
        borderRight: '0.5px solid #ECEAE4', display: 'flex', flexDirection: 'column'
      }}>
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ width: '210px', background: '#F0EEE9', borderRight: '0.5px solid #ECEAE4' }}>
            <SidebarContent />
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)' }} onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      padding: '10px 14px 4px',
      fontSize: '10px', textTransform: 'uppercase',
      letterSpacing: '0.08em', color: '#bbb', fontWeight: '500'
    }}>{children}</div>
  )
}
