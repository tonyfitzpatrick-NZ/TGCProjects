import React, { useState, useEffect } from 'react'
import { Plus, Calendar, CheckSquare, Bell, Activity, ArrowRight, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Button from '../components/common/Button'
import { Link, useNavigate } from 'react-router-dom'

const NAVY = '#1B2B4B'

export default function DashboardPage() {
  const [activeProjects, setActiveProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchActiveProjects = async () => {
      setLoadingProjects(true)
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, status, client_name, location, updated_at')
          .in('status', ['Active', 'In Progress', 'Planning'])   // ← Fixed capitalisation
          .order('updated_at', { ascending: false })
          .limit(6)

        if (!error) {
          setActiveProjects(data || [])
        } else {
          console.error('Supabase error:', error)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingProjects(false)
      }
    }
    fetchActiveProjects()
  }, [])

  const handleNewProject = () => {
    navigate('/projects')
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
          Good afternoon
        </h1>
        <p style={{ color: '#666', marginTop: '6px', fontSize: '15px' }}>
          Here's an overview of your active work.
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button onClick={handleNewProject}>
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

      {/* Active Projects */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>
            Active Projects
          </h2>
          <Link to="/projects" style={{ fontSize: '14px', color: NAVY, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View all <ArrowRight size={16} />
          </Link>
        </div>

        {loadingProjects ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading projects...</div>
        ) : activeProjects.length === 0 ? (
          <div style={{ background: '#fff', border: `1px solid #ECEAE4`, borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
            <p style={{ color: '#666', marginBottom: '16px' }}>You don't have any active projects yet.</p>
            <Button onClick={handleNewProject}>
              <Plus size={16} /> Create your first project
            </Button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {activeProjects.map(project => (
              <Link key={project.id} to={`/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  background: '#fff',
                  border: `1px solid #ECEAE4`,
                  borderRadius: '10px',
                  padding: '18px',
                  cursor: 'pointer'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '6px' }}>
                    {project.name}
                  </div>
                  {project.client_name && <div style={{ fontSize: '13px', color: '#666' }}>{project.client_name}</div>}
                  {project.location && <div style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>{project.location}</div>}
                  <div style={{
                    display: 'inline-block',
                    fontSize: '12px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: '#E6F5EF',
                    color: '#0F6E56',
                    fontWeight: '500'
                  }}>
                    {project.status || 'Active'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        <div style={{ background: '#fff', border: `1px solid #ECEAE4`, borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <CheckSquare size={20} color="#1B2B4B" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>My Tasks</h3>
          </div>
          <div style={{ color: '#888', fontSize: '14px' }}>Task widget coming soon...</div>
        </div>

        <div style={{ background: '#fff', border: `1px solid #ECEAE4`, borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Calendar size={20} color="#1B2B4B" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Upcoming Deadlines</h3>
          </div>
          <div style={{ color: '#888', fontSize: '14px' }}>Deadlines widget coming soon...</div>
        </div>

        <div style={{ background: '#fff', border: `1px solid #ECEAE4`, borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <MessageCircle size={20} color="#1B2B4B" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Messages</h3>
          </div>
          <div style={{ color: '#888', fontSize: '14px' }}>Messages widget coming soon...</div>
        </div>

      </div>
    </div>
  )
}