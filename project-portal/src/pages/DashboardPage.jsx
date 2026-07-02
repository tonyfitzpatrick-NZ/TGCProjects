import React from 'react'
import { Plus, Calendar, CheckSquare, Bell, Activity } from 'lucide-react'
import Button from '../components/common/Button'

export default function DashboardPage() {
  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Welcome Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
          Good afternoon, Tony
        </h1>
        <p style={{ color: '#666', marginTop: '6px', fontSize: '15px' }}>
          Here's what's happening across your projects today.
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button>
            <Plus size={16} /> New Project
          </Button>
          <Button variant="secondary">
            Generate Specification
          </Button>
          <Button variant="secondary">
            View Schedule Library
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '24px',
        marginBottom: '32px'
      }}>
        
        {/* Active Projects */}
        <div style={{ background: '#fff', border: `1px solid #ECEAE4`, borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Activity size={20} color="#1B2B4B" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Active Projects</h3>
          </div>
          <div style={{ color: '#888', fontSize: '14px' }}>
            Dashboard widget coming soon...
          </div>
        </div>

        {/* My Tasks */}
        <div style={{ background: '#fff', border: `1px solid #ECEAE4`, borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <CheckSquare size={20} color="#1B2B4B" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>My Tasks</h3>
          </div>
          <div style={{ color: '#888', fontSize: '14px' }}>
            Dashboard widget coming soon...
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div style={{ background: '#fff', border: `1px solid #ECEAE4`, borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Calendar size={20} color="#1B2B4B" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Upcoming Deadlines</h3>
          </div>
          <div style={{ color: '#888', fontSize: '14px' }}>
            Dashboard widget coming soon...
          </div>
        </div>

      </div>

      {/* Recent Activity + Notifications */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: '24px' 
      }}>
        
        {/* Recent Activity */}
        <div style={{ background: '#fff', border: `1px solid #ECEAE4`, borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Activity size={20} color="#1B2B4B" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Recent Activity</h3>
          </div>
          <div style={{ color: '#888', fontSize: '14px' }}>
            Activity feed coming soon...
          </div>
        </div>

        {/* Notifications */}
        <div style={{ background: '#fff', border: `1px solid #ECEAE4`, borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Bell size={20} color="#1B2B4B" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Notifications</h3>
          </div>
          <div style={{ color: '#888', fontSize: '14px' }}>
            Notifications preview coming soon...
          </div>
        </div>

      </div>
    </div>
  )
}