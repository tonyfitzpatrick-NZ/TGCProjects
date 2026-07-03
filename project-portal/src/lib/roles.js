// src/lib/roles.js
// Centralized role definitions for TGC Project Management Portal

export const ROLES = {
  system_admin: {
    value: 'system_admin',
    label: 'System Admin',
    description: 'Full access to everything in the platform',
    color: '#993C1D',
    bg: '#FAECE7',
  },
  project_lead: {
    value: 'project_lead',
    label: 'Project Lead',
    description: 'Full access to project management, tasks, products, and user management',
    color: '#534AB7',
    bg: '#EEEDFE',
  },
  consultant_lead: {
    value: 'consultant_lead',
    label: 'Consultant Lead',
    description: 'Manage assigned projects and team tasks. Can request new team members',
    color: '#854F0B',
    bg: '#FAEEDA',
  },
  consultant: {
    value: 'consultant',
    label: 'Consultant',
    description: 'Access to assigned projects and management of own tasks',
    color: '#0F6E56',
    bg: '#E1F5EE',
  },
  viewer: {
    value: 'viewer',
    label: 'Viewer',
    description: 'View-only access + messaging',
    color: '#666666',
    bg: '#F0F0F0',
  },
}

// Get role details by value
export function getRole(roleValue) {
  return ROLES[roleValue] || ROLES.consultant
}

// Array for dropdowns
export const ROLE_OPTIONS = Object.values(ROLES).map(r => ({
  value: r.value,
  label: r.label,
}))

// Roles with full user management permissions
export const FULL_USER_MANAGEMENT_ROLES = ['system_admin', 'project_lead']

// Roles that can manage their own team
export const TEAM_MANAGEMENT_ROLES = ['consultant_lead']