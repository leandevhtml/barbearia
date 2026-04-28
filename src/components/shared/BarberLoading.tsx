'use client';

// Pure CSS loading screen — zero Framer Motion, zero JS animation overhead
// Uses CSS @keyframes which run on the compositor thread (GPU) on iOS
export default function BarberLoading({ message = 'PREPARANDO SUA CADEIRA...' }: { message?: string }) {
  return (
    <div className="barber-loading-overlay">
      <div className="barber-loading-inner">
        {/* CSS-only spinner ring */}
        <div className="barber-spinner">
          <div className="barber-spinner-track" />
          <div className="barber-spinner-head" />
          {/* Barber pole center bar */}
          <div className="barber-pole-bar" />
        </div>
        {/* Text */}
        <p className="barber-loading-text">{message}</p>
        {/* Dots */}
        <div className="barber-dots">
          <span className="barber-dot" style={{ animationDelay: '0s' }} />
          <span className="barber-dot" style={{ animationDelay: '0.2s' }} />
          <span className="barber-dot" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>

      <style>{`
        .barber-loading-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #050505;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          /* GPU layer hint — prevents compositing conflicts */
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          will-change: opacity;
          animation: fadeIn 0.2s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .barber-loading-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        .barber-spinner {
          position: relative;
          width: 72px;
          height: 72px;
          margin-bottom: 28px;
        }

        .barber-spinner-track {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid rgba(255, 110, 0, 0.15);
        }

        .barber-spinner-head {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #ff6e00;
          /* CSS animation runs on compositor thread — zero JS */
          animation: spin 0.9s linear infinite;
          will-change: transform;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .barber-pole-bar {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) translateZ(0);
          width: 3px;
          height: 28px;
          border-radius: 999px;
          background: linear-gradient(to bottom, #ef4444, #ffffff, #3b82f6);
          animation: pulse-bar 1.6s ease-in-out infinite;
          will-change: opacity;
        }

        @keyframes pulse-bar {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }

        .barber-loading-text {
          font-size: 9px;
          font-weight: 900;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          letter-spacing: 0.5em;
          margin-bottom: 14px;
          font-family: var(--font-outfit, sans-serif);
        }

        .barber-dots {
          display: flex;
          gap: 5px;
          align-items: center;
        }

        .barber-dot {
          display: block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ff6e00;
          animation: dot-pulse 1s ease-in-out infinite;
          will-change: opacity, transform;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
        }

        @keyframes dot-pulse {
          0%, 100% { opacity: 0.25; transform: scale(0.8) translateZ(0); }
          50%       { opacity: 1;    transform: scale(1.2) translateZ(0); }
        }
      `}</style>
    </div>
  );
}
