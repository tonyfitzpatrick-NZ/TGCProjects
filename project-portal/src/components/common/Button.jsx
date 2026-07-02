import React from 'react'

const NAVY = '#1B2B4B'
const GOLD = '#B8952A'
const BORDER = '#D0CEC6'
const DANGER = '#DC2626'

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost'
  size = 'md',         // 'sm' | 'md' | 'lg'
  disabled = false,
  onClick,
  type = 'button',
  style = {},
  ...props
}) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'inherit',
    fontWeight: '500',
    borderRadius: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.6 : 1,
    ...style,
  }

  const variants = {
    primary: {
      background: NAVY,
      color: '#fff',
      border: 'none',
      padding: size === 'sm' ? '6px 14px' : size === 'lg' ? '12px 24px' : '9px 18px',
      fontSize: size === 'sm' ? '12px' : '14px',
    },
    secondary: {
      background: 'transparent',
      color: '#555',
      border: `1px solid ${BORDER}`,
      padding: size === 'sm' ? '6px 14px' : size === 'lg' ? '12px 24px' : '9px 18px',
      fontSize: size === 'sm' ? '12px' : '14px',
    },
    danger: {
      background: DANGER,
      color: '#fff',
      border: 'none',
      padding: size === 'sm' ? '6px 14px' : size === 'lg' ? '12px 24px' : '9px 18px',
      fontSize: size === 'sm' ? '12px' : '14px',
    },
    ghost: {
      background: 'transparent',
      color: '#666',
      border: 'none',
      padding: size === 'sm' ? '4px 10px' : '6px 14px',
      fontSize: size === 'sm' ? '12px' : '13px',
    },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyle, ...variants[variant] }}
      {...props}
    >
      {children}
    </button>
  )
}