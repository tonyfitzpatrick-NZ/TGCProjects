import React, { useState, useEffect } from 'react'
import { Plus, Calendar, CheckSquare, Bell, Activity, ArrowRight, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Button from '../components/common/Button'
import { Link, useNavigate } from 'react-router-dom'

const NAVY = '#1B2B4B'

export default function DashboardPage() {
  const [activeProjects, setActiveProjects] = useState([])
  const [myTasks, setMyTasks] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(true)
  const navigate = useNavigate()

  // Fetch current user
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()
  }, [])

  // Fetch active projects
  useEffect(() => {
    const fetchActiveProjects = async () => {
      setLoadingProjects(true)
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, status, client_name, location, updated_at')
          .in('status', ['Active', 'In Progress', 'Planning'])
          .order('updated_at', { ascending: false })
          .limit(6)

        if (!error) setActiveProjects(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingProjects(false)
      }
    }
    fetchActiveProjects()
  }, [])

  // Fetch My Tasks (assigned to current user)
  useEffect(() => {
    if (!userId) return

    const fetchMyTasks = async () => {
      setLoadingTasks(true)
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            status,
            deadline,
            project_id,
            projects:project_id (name)
          `)
          .eq('assigned_user_id', userId)
          .not('status', 'eq', 'done')
          .order('deadline', { ascending: true, nullsFirst: false })
          .limit(8)

        if (!error) {
          setMyTasks(data || [])
        }
      } catch (err) {
        console.error('Error fetching tasks:', err)
      } finally {
        setLoadingTasks(false)
      }
    }

    fetchMyTasks()
  }, [userId])

  const handleNewProject = () => navigate('/projects')
  const handleNewTask = () => navigate('/tasks')

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
          <Button variant="secondary" onClick={handleNewTask}>
            New Task
          </Button>
          <Button variant="secondary">
            Generate Specification
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
            <Button onClick={handleNewProject}>Create your first project</Button>
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
                    display: 'inline-block', fontSize: '12px', padding: '3px 10px',
                    borderRadius: '20px', background: '#E6F5EF', color: '#0F6E56', fontWeight: '500'
                  }}>
                    {project.status}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* My Tasks Widget */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>
            My Tasks
          </h2>
          <Button variant="secondary" onClick={handleNewTask}>
            New Task
          </Button>
        </div>

        {loadingTasks ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading tasks...</div>
        ) : myTasks.length === 0 ? (
          <div style={{ background: '#fff', border: `1px solid #ECEAE4`, borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
            <p style={{ color: '#666', marginBottom: '16px' }}>You have no open tasks assigned to you.</p>
            <Button onClick={handleNewTask}>Create your first task</Button>
          </div>
        ) : (
          <div style={{ background: '#fff', border: `1px solid #ECEAE4`, borderRadius: '12px', overflow: 'hidden' }}>
            {myTasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => navigate('/tasks')}
                style={{ 
                  padding: '14px 20px', 
                  borderBottom: `1px solid #ECEAE4`, 
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', color: '#1a1a1a' }}>{task.title}</div>
                  {task.projects?.name && (
                    <div style={{ fontSize: '12px', color: '#888' }}>{task.projects.name}</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {task.deadline && (
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      {new Date(task.deadline).toLocaleDateString()}
                    </div>
                  )}
                  <div style={{
                    fontSize: '12px',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    background: task.status === 'done' ? '#E6F5EF' : '#FFF4E0',
                    color: task.status === 'done' ? '#0F6E56' : '#854F0B'
                  }}>
                    {task.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Other Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
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