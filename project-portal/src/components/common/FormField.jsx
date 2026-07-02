import React from 'react'

const ERROR_RED = '#993C1D'

export default function FormField({
  label,
  required = false,
  helper,
  error,
  children,
  style = {},
}) {
  return (
    <div style={{ marginBottom: '16px', ...style }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '600',
          color: '#555',
          marginBottom: '5px',
        }}>
          {label}
          {required && <span style={{ color: ERROR_RED, marginLeft: '4px' }}>*</span>}
        </label>
      )}

      {helper && (
        <div style={{
          fontSize: '11px',
          color: '#888',
          marginBottom: '6px',
          lineHeight: '1.4',
        }}>
          {helper}
        </div>
      )}

      <div>
        {children}
      </div>

      {error && (
        <div style={{
          marginTop: '5px',
          fontSize: '12px',
          color: ERROR_RED,
        }}>
          {error}
        </div>
      )}
    </div>
  )
}