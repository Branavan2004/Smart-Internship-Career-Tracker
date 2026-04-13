import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuthContext } from "@asgardeo/auth-react";

/**
 * SessionManager handles token refresh, expiration warnings, and expired states.
 * It integrates directly with the Asgardeo Auth React SDK.
 */
const SessionManager = () => {
  const { 
    state, 
    getAccessToken, 
    getDecodedIDToken, 
    signIn, 
    signOut 
  } = useAuthContext();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExpiredScreen, setShowExpiredScreen] = useState(false);
  const [warningModal, setWarningModal] = useState({ show: false, secondsLeft: 0 });
  
  const refreshIntervalRef = useRef(null);
  const warningIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const clearAllIntervals = () => {
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  // 1. Silent Refresh Logic (Every 50 seconds)
  const performSilentRefresh = useCallback(async () => {
    if (!state.isAuthenticated) return;
    
    setIsRefreshing(true);
    try {
      await getAccessToken();
    } catch (error) {
      console.error("Silent refresh failed:", error);
      handleSessionExpired();
    } finally {
      // Small delay to make the "fade out" noticeable
      setTimeout(() => setIsRefreshing(false), 2000);
    }
  }, [state.isAuthenticated, getAccessToken]);

  const handleSessionExpired = useCallback(() => {
    clearAllIntervals();
    signOut().catch(() => null);
    setShowExpiredScreen(true);
  }, [signOut]);

  // 2. Session Warning & Expiry Detection
  const checkSessionExpiry = useCallback(async () => {
    if (!state.isAuthenticated) return;

    try {
      const decodedToken = await getDecodedIDToken();
      if (!decodedToken?.exp) return;

      const currentTime = Math.floor(Date.now() / 1000);
      const timeLeft = decodedToken.exp - currentTime;

      // 2 minutes (120 seconds) before expiration
      if (timeLeft <= 120 && timeLeft > 0 && !warningModal.show) {
        setWarningModal({ show: true, secondsLeft: timeLeft });
      } else if (timeLeft <= 0) {
        handleSessionExpired();
      }
    } catch (error) {
      console.error("Failed to check expiry:", error);
    }
  }, [state.isAuthenticated, getDecodedIDToken, warningModal.show, handleSessionExpired]);

  useEffect(() => {
    if (state.isAuthenticated) {
      // Start silent refresh interval
      refreshIntervalRef.current = setInterval(performSilentRefresh, 50000);
      
      // Start expiry check interval
      warningIntervalRef.current = setInterval(checkSessionExpiry, 30000);
    } else {
      clearAllIntervals();
    }

    return clearAllIntervals;
  }, [state.isAuthenticated, performSilentRefresh, checkSessionExpiry]);

  // Handle countdown for warning modal
  useEffect(() => {
    if (warningModal.show && warningModal.secondsLeft > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setWarningModal(prev => ({ ...prev, secondsLeft: prev.secondsLeft - 1 }));
      }, 1000);
    } else if (warningModal.secondsLeft === 0 && warningModal.show) {
      handleSessionExpired();
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [warningModal.show, warningModal.secondsLeft, handleSessionExpired]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // UI - Session Expired Screen
  if (showExpiredScreen) {
    return (
      <div style={styles.fullPageOverlay}>
        <div style={styles.whiteCard}>
          <div style={styles.iconCircle}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 style={styles.cardHeading}>Your session has expired</h2>
          <p style={styles.cardSubtext}>You've been signed out for your security.</p>
          <button style={styles.primaryButton} onClick={() => { setShowExpiredScreen(false); signIn(); }}>
            Sign back in
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 1. Silent Refresh Banner */}
      <div style={{
        ...styles.refreshBanner,
        opacity: isRefreshing ? 1 : 0,
        pointerEvents: isRefreshing ? 'auto' : 'none'
      }}>
        <div style={styles.spinner} />
        Keeping your session alive...
      </div>

      {/* 3. Session Warning Modal */}
      {warningModal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Your session expires in {formatTime(warningModal.secondsLeft)}</h3>
            <p style={{ color: '#55637e', marginBottom: '1.5rem' }}>
              Would you like to stay signed in?
            </p>
            <div style={styles.buttonRow}>
              <button 
                style={styles.primaryButton} 
                onClick={async () => {
                  setWarningModal({ show: false, secondsLeft: 0 });
                  await getAccessToken();
                }}
              >
                Stay signed in
              </button>
              <button 
                style={styles.ghostButton} 
                onClick={() => handleSessionExpired()}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  refreshBanner: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '36px',
    background: '#1a1f2e',
    color: '#ffffff',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    zIndex: 9999,
    transition: 'opacity 0.6s ease'
  },
  spinner: {
    width: '12px',
    height: '12px',
    border: '2px solid rgba(255,255,255,0.2)',
    borderTop: '2px solid #f97316',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  fullPageOverlay: {
    position: 'fixed',
    inset: 0,
    background: '#1a1f2e',
    display: 'grid',
    placeItems: 'center',
    zIndex: 10000
  },
  whiteCard: {
    background: '#ffffff',
    borderRadius: '24px',
    padding: '3rem 2rem',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90%'
  },
  iconCircle: {
    width: '80px',
    height: '80px',
    background: 'rgba(249, 115, 22, 0.1)',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    margin: '0 auto 1.5rem'
  },
  cardHeading: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1a1f2e',
    margin: '0 0 0.5rem'
  },
  cardSubtext: {
    color: '#55637e',
    marginBottom: '2rem'
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(26, 31, 46, 0.85)',
    backdropFilter: 'blur(4px)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 9998
  },
  modalContent: {
    background: '#ffffff',
    borderRadius: '24px',
    padding: '2rem',
    width: '100%',
    maxWidth: '440px',
    textAlign: 'center'
  },
  buttonRow: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center'
  },
  primaryButton: {
    background: '#f97316',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '0.75rem 1.5rem',
    fontWeight: 600,
    cursor: 'pointer'
  },
  ghostButton: {
    background: 'rgba(23, 32, 51, 0.06)',
    color: '#1a1f2e',
    border: 'none',
    borderRadius: '12px',
    padding: '0.75rem 1.5rem',
    fontWeight: 600,
    cursor: 'pointer'
  }
};

export default SessionManager;
