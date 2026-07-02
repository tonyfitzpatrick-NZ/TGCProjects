import React from 'react'
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react'

const NAVY = '#1B2B4B'
const GOLD = '#B8952A'

const toastStyles = {
  success: { bg: '#E6F5EF', border: '#BFE6D5', color: '#0F6E56', icon: CheckCircle },
  error:   { bg: '#FAECE7', border: '#F5C6B0', color: '#993C1D', icon: AlertCircle },
  warning: { bg: '#FFF4E0', border: '#F0D9A8', color: '#854F0B', icon: AlertTriangle },
  info:    { bg: '#EEF1F6', border: '#D0CEC6', color: NAVY,       icon: Info },
}

export default function Toast({ toast, onClose }) {
  const style = toastStyles[toast.type] || toastStyles.info
  const Icon = style.icon

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '14px 18px',
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      maxWidth: '380px',
      fontSize: '14px',
      color: style.color,
    }}>
      <Icon size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
      
      <div style={{ flex: 1, paddingRight: '8px' }}>
        {toast.message}
      </div>

      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: style.color,
          cursor: 'pointer',
          padding: '2px',
          opacity: 0.7,
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}
