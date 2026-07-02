import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Button from './Button'

export default function CreateTaskModal({ isOpen, onClose, projectId = null, onTaskCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    status: 'Open',
    hours_allowed: '',
    project_id: projectId || '',
    assignment_type: 'user', // 'user' or 'company'
    assigned_user_id: '',
    assigned_company_id: '',
  })

  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch dropdown data
  useEffect(() => {
    if (!isOpen) return

    const fetchData = async () => {
      try {
        const [projRes, userRes, compRes] = await Promise.all([
          supabase.from('projects').select('id, name').order('name'),
          supabase.from('profiles').select('id, full_name').order('full_name'),
          supabase.from('companies').select('id, name').order('name'),
        ])

        if (projRes.data) setProjects(projRes.data)
        if (userRes.data) setUsers(userRes.data)
        if (compRes.data) setCompanies(compRes.data)
      } catch (err) {
        console.error(err)
      }
    }

    fetchData()
  }, [isOpen])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        deadline: '',
        status: 'Open',
        hours_allowed: '',
        project_id: projectId || '',
        assignment_type: 'user',
        assigned_user_id: '',
        assigned_company_id: '',
      })
      setError(null)
    }
  }, [isOpen, projectId])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const taskData = {
        title: formData.title,
        description: formData.description || null,
        deadline: formData.deadline || null,
        status: formData.status,
        hours_allowed: formData.hours_allowed ? parseFloat(formData.hours_allowed) : null,
        project_id: formData.project_id,
        assigned_user_id: formData.assignment_type === 'user' ? formData.assigned_user_id || null : null,
        assigned_company_id: formData.assignment_type === 'company' ? formData.assigned_company_id || null : null,
      }

      const { error: insertError } = await supabase.from('tasks').insert([taskData])

      if (insertError) throw insertError

      onTaskCreated?.()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px', width: '520px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #ECEAE4' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Create New Task</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{ background: '#FAECE7', color: '#993C1D', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* Project Selection */}
          {!projectId && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Project *</label>
              <select
                value={formData.project_id}
                onChange={e => handleChange('project_id', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D0CEC6' }}
              >
                <option value="">Select a project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Task Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => handleChange('title', e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D0CEC6' }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Description</label>
            <textarea
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D0CEC6', resize: 'vertical' }}
            />
          </div>

          {/* Deadline + Status */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={e => handleChange('deadline', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D0CEC6' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Status</label>
              <select
                value={formData.status}
                onChange={e => handleChange('status', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D0CEC6' }}
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="For Review">For Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Hours Allowed */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Hours Allowed (optional)</label>
            <input
              type="number"
              step="0.5"
              value={formData.hours_allowed}
              onChange={e => handleChange('hours_allowed', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D0CEC6' }}
            />
          </div>

          {/* Assignment Type */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Assign To</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleChange('assignment_type', 'user')}
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: formData.assignment_type === 'user' ? `2px solid ${NAVY}` : '1px solid #D0CEC6',
                  background: formData.assignment_type === 'user' ? '#EEF1F6' : 'white',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                User
              </button>
              <button
                type="button"
                onClick={() => handleChange('assignment_type', 'company')}
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: formData.assignment_type === 'company' ? `2px solid ${NAVY}` : '1px solid #D0CEC6',
                  background: formData.assignment_type === 'company' ? '#EEF1F6' : 'white',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Company
              </button>
            </div>
          </div>

          {/* User Dropdown */}
          {formData.assignment_type === 'user' && (
            <div style={{ marginBottom: '20px' }}>
              <select
                value={formData.assigned_user_id}
                onChange={e => handleChange('assigned_user_id', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D0CEC6' }}
              >
                <option value="">Select a user...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Company Dropdown */}
          {formData.assignment_type === 'company' && (
            <div style={{ marginBottom: '20px' }}>
              <select
                value={formData.assigned_company_id}
                onChange={e => handleChange('assigned_company_id', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D0CEC6' }}
              >
                <option value="">Select a company...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" disabled={loading || !formData.title || !formData.project_id}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}