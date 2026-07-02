import React from 'react'
import Button from './Button'

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style = {},
}) {
  return (
    <div style={{
      padding: '48px 24px',
      textAlign: 'center',
      color: '#888',
      ...style,
    }}>
      {icon && (
        <div style={{ marginBottom: '16px', opacity: 0.6 }}>
          {icon}
        </div>
      )}
      
      <h3 style={{ 
        margin: '0 0 8px 0', 
        fontSize: '18px', 
        fontWeight: '600', 
        color: '#555' 
      }}>
        {title}
      </h3>
      
      {description && (
        <p style={{ 
          margin: '0 0 20px 0', 
          fontSize: '14px', 
          maxWidth: '320px', 
          marginLeft: 'auto', 
          marginRight: 'auto',
          lineHeight: '1.5'
        }}>
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}