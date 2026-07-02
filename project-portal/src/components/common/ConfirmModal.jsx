import React from 'react'
import Button from './Button'

export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger', // 'danger' or 'primary'
}) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        width: '380px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#1a1a1a' }}>{title}</h3>
        <p style={{ margin: '0 0 24px 0', color: '#555', fontSize: '14px', lineHeight: '1.5' }}>{message}</p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}