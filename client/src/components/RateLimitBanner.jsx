import React, { useEffect, useState } from "react";
import { useApiStatus } from "../hooks/useApiStatus";

/**
 * RateLimitBanner shows an orange countdown banner when APIM throttling is active.
 * It also broadcasts a toast on final retry failure.
 */
const RateLimitBanner = () => {
  const { isRateLimited, retryIn } = useApiStatus();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isRateLimited) {
      setIsVisible(true);
    } else {
      // Small delay for fade out
      const timer = setTimeout(() => setIsVisible(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isRateLimited]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isVisible && !isRateLimited) return null;

  return (
    <div style={{
      ...styles.banner,
      opacity: isRateLimited ? 1 : 0,
      transform: isRateLimited ? 'translateY(0)' : 'translateY(-100%)'
    }}>
      <div style={styles.content}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        API limit reached — you can continue in {formatTime(retryIn)}
      </div>
    </div>
  );
};

const styles = {
  banner: {
    position: 'fixed',
    top: '36px', // Offset from SessionManager banner
    left: 0,
    width: '100%',
    height: '36px',
    background: '#f97316',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998, // Just below SessionManager
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }
};

export default RateLimitBanner;
