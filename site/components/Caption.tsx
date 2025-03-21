import type * as React from 'react'

export function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        textAlign: 'center',
        color: '#757575',
        fontSize: '.85rem',
        marginTop: -8,
        paddingRight: 12,
        paddingLeft: 12,
      }}
    >
      {children}
    </div>
  )
}
