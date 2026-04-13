import React from "react";

const EmptyState = ({ onAddFirst }) => {
  return (
    <div className="panel" style={{ display: 'grid', placeItems: 'center', padding: '4rem 2rem', textAlign: 'center', minHeight: '400px' }}>
      <div style={{ maxWidth: '420px', display: 'grid', gap: '1.5rem', justifyItems: 'center' }}>
        {/* Hand-drawn style Clipboard SVG */}
        <svg 
          width="120" 
          height="120" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#f97316" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ opacity: 0.9 }}
        >
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M9 14h6" />
          <path d="M9 18h6" />
          <path d="M9 10h6" />
        </svg>

        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#1a1f2e' }}>
            Your job hunt starts here
          </h2>
          <p className="muted-text" style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
            Add your first application to start tracking interviews, follow-ups, and outcomes.
          </p>
        </div>

        <button 
          type="button" 
          className="secondary-button" 
          style={{ 
            background: '#f97316', 
            color: 'white', 
            padding: '1rem 2rem', 
            fontSize: '1rem', 
            fontWeight: 600,
            boxShadow: '0 10px 25px -5px rgba(249, 115, 22, 0.4)'
          }}
          onClick={onAddFirst}
        >
          Add your first application
        </button>
      </div>
    </div>
  );
};

export default EmptyState;
