import React from 'react';

const Toast = ({ message, type, onClose }) => {
  const isError = type === 'error';

  return (
    <div 
      className={`toast-item ${isError ? 'toast-error' : 'toast-success'}`}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: '12px 20px',
        borderRadius: '16px',
        background: isError ? '#fee2e2' : '#1a1f2e',
        color: isError ? '#b42318' : '#ffffff',
        border: isError ? '1px solid #fecaca' : '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 9999,
        animation: 'toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        fontSize: '0.95rem',
        fontWeight: 500
      }}
    >
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: isError ? '#b42318' : '#f97316'
      }} />
      <span>{message}</span>
      <button 
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '4px',
          opacity: 0.6,
          fontSize: '1.2rem',
          lineHeight: 1
        }}
      >
        ×
      </button>

      <style>{`
        @keyframes toast-in {
          from { transform: translateY(100%) scale(0.9); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Toast;
