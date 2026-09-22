import React, { useState, useEffect } from 'react'
import { Plus, ArrowRight, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Button from '../components/common/Button'
import { Link, useNavigate } from 'react-router-dom'
import CreateTaskModal from '../components/common/CreateTaskModal'
import NewProjectModal from '../components/NewProjectModal'

const NAVY = '#1B2B4B'

export default function DashboardPage() {
  const [activeProjects, setActiveProjects] = useState([])
  const [myTasks, setMyTasks] = useState([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([])
  const [recentMessages, setRecentMessages] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [loadingDeadlines, setLoadingDeadlines] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(true)

  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)

  const navigate = useNavigate()
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()
  }, [])

  useEffect(() => {
    const fetchActiveProjects = async () => {
      setLoadingProjects(true)
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, status, client_name, address, updated_at')
          .eq('status', 'Active')
          .order('updated_at', { ascending: false })
          .limit(6)

        if (!error) setActiveProjects(data || [])
        if (error) console.error('Error fetching projects:', error)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingProjects(false)
      }
    }
    fetchActiveProjects()
  }, [])

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
          .not('status', 'eq', 'Completed')
          .order('deadline', { ascending: true, nullsFirst: false })
          .limit(6)

        if (!error) setMyTasks(data || [])
        if (error) console.error('Error fetching tasks:', error)
      } catch (err) {
        console.error('Error fetching tasks:', err)
      } finally {
        setLoadingTasks(false)
      }
    }
    fetchMyTasks()
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const fetchUpcomingDeadlines = async () => {
      setLoadingDeadlines(true)
      try {
        const today = new Date().toISOString().split('T')[0]

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
          .not('status', 'eq', 'Completed')
          .gte('deadline', today)
          .order('deadline', { ascending: true })
          .limit(6)

        if (!error) setUpcomingDeadlines(data || [])
        if (error) console.error('Error fetching deadlines:', error)
      } catch (err) {
        console.error('Error fetching deadlines:', err)
      } finally {
        setLoadingDeadlines(false)
      }
    }
    fetchUpcomingDeadlines()
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const fetchRecentMessages = async () => {
      setLoadingMessages(true)
      try {
        const { data, error } = await supabase
          .from('message_threads')
          .select(`
            id,
            subject,
            updated_at,
            project_id,
            status,
            projects:project_id (name)
          `)
          .neq('status', 'Archived')
          .order('updated_at', { ascending: false })
          .limit(6)

        if (!error) setRecentMessages(data || [])
        if (error) console.error('Error fetching messages:', error)
      } catch (err) {
        console.error('Error fetching messages:', err)
      } finally {
        setLoadingMessages(false)
      }
    }
    fetchRecentMessages()
  }, [userId])

  const handleNewTask = () => setShowCreateTaskModal(true)
  const handleViewMessages = () => navigate('/notifications')

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
          Good afternoon
        </h1>
        <p style={{ color: '#666', marginTop: '6px', fontSize: '15px' }}>
          Here's an overview of your active work.
        </p>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button onClick={() => setShowNewProjectModal(true)}>
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
          <div style={{ background: '#fff', border: '1px solid #ECEAE4', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
            <p style={{ color: '#666', marginBottom: '16px' }}>You don't have any active projects yet.</p>
            <Button onClick={() => setShowNewProjectModal(true)}>Create your first project</Button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {activeProjects.map(project => (
              <Link key={project.id} to={`/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  background: '#fff',
                  border: '1px solid #ECEAE4',
                  borderRadius: '10px',
                  padding: '18px',
                  cursor: 'pointer'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '6px' }}>
                    {project.name}
                  </div>
                  {project.client_name && <div style={{ fontSize: '13px', color: '#666' }}>{project.client_name}</div>}
                  {project.address && (
                    <div style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>
                      {project.address}
                    </div>
                  )}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>My Tasks</h2>
            <Button variant="secondary" onClick={handleNewTask}>New Task</Button>
          </div>

          {loadingTasks ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>Loading tasks...</div>
          ) : myTasks.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #ECEAE4', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
              <p style={{ color: '#666', marginBottom: '12px' }}>No open tasks assigned to you.</p>
              <Button onClick={handleNewTask}>Create your first task</Button>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #ECEAE4', borderRadius: '12px', overflow: 'hidden' }}>
              {myTasks.map(task => (
                <div key={task.id} onClick={() => navigate('/tasks')} style={{
                  padding: '14px 20px', borderBottom: '1px solid #ECEAE4', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{task.title}</div>
                    {task.projects?.name && <div style={{ fontSize: '12px', color: '#888' }}>{task.projects.name}</div>}
                  </div>
                  {task.deadline && (
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      {new Date(task.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>Upcoming Deadlines</h2>
            <Button variant="secondary" onClick={handleNewTask}>New Task</Button>
          </div>

          {loadingDeadlines ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>Loading deadlines...</div>
          ) : upcomingDeadlines.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #ECEAE4', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
              <p style={{ color: '#666', marginBottom: '12px' }}>No upcoming deadlines.</p>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #ECEAE4', borderRadius: '12px', overflow: 'hidden' }}>
              {upcomingDeadlines.map(task => (
                <div key={task.id} onClick={() => navigate('/tasks')} style={{
                  padding: '14px 20px', borderBottom: '1px solid #ECEAE4', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{task.title}</div>
                    {task.projects?.name && <div style={{ fontSize: '12px', color: '#888' }}>{task.projects.name}</div>}
                  </div>
                  {task.deadline && (
                    <div style={{
                      fontSize: '13px',
                      color: new Date(task.deadline) < new Date() ? '#E85D5D' : '#666',
                      fontWeight: new Date(task.deadline) < new Date() ? '500' : '400'
                    }}>
                      {new Date(task.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageCircle size={20} color="#1B2B4B" />
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>Messages</h2>
          </div>
          <Button variant="secondary" onClick={handleViewMessages}>View Messages</Button>
        </div>

        {loadingMessages ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>Loading messages...</div>
        ) : recentMessages.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #ECEAE4', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <p style={{ color: '#666', marginBottom: '12px' }}>No active message threads.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #ECEAE4', borderRadius: '12px', overflow: 'hidden' }}>
            {recentMessages.map(thread => (
              <div
                key={thread.id}
                onClick={() => navigate(`/projects/${thread.project_id}`)}
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid #ECEAE4',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '500' }}>{thread.subject}</div>
                  {thread.projects?.name && (
                    <div style={{ fontSize: '12px', color: '#888' }}>{thread.projects.name}</div>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {new Date(thread.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateTaskModal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onTaskCreated={() => setShowCreateTaskModal(false)}
      />

      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onCreated={() => {
            setShowNewProjectModal(false)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
