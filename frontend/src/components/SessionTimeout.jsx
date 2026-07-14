import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Clock } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

// 30 minutes in ms
const TIMEOUT_MS = 30 * 60 * 1000;
// 60 seconds warning
const WARNING_MS = 60 * 1000;

const SessionTimeout = ({ children }) => {
  const { user, logout } = useAuth();
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WARNING_MS / 1000);
  
  const resetTimer = useCallback(() => {
    setIsWarningVisible(false);
    setTimeLeft(WARNING_MS / 1000);
  }, []);

  useEffect(() => {
    // Only run if user is logged in
    if (!user) return;

    let warningTimer;
    let logoutTimer;
    let countdownInterval;

    const startTimers = () => {
      // Clear existing timers
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      clearInterval(countdownInterval);

      // Set warning timer (29 mins)
      warningTimer = setTimeout(() => {
        setIsWarningVisible(true);
        
        // Start countdown for the modal
        let currentSeconds = WARNING_MS / 1000;
        countdownInterval = setInterval(() => {
          currentSeconds -= 1;
          setTimeLeft(currentSeconds);
          if (currentSeconds <= 0) clearInterval(countdownInterval);
        }, 1000);

      }, TIMEOUT_MS - WARNING_MS);

      // Set actual logout timer (30 mins)
      logoutTimer = setTimeout(() => {
        logout();
      }, TIMEOUT_MS);
    };

    // Events that reset the timer
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleUserActivity = () => {
      // If warning is already showing, don't reset automatically on mouse move.
      // User MUST click the "Extend Session" button to reset.
      if (!isWarningVisible) {
        startTimers();
      }
    };

    // Attach listeners
    events.forEach(event => document.addEventListener(event, handleUserActivity));
    
    // Start timers initially
    startTimers();

    return () => {
      events.forEach(event => document.removeEventListener(event, handleUserActivity));
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      clearInterval(countdownInterval);
    };
  }, [user, isWarningVisible, logout]);

  const handleExtend = () => {
    resetTimer();
    // Simulate user activity to restart the useEffect timers
    document.dispatchEvent(new Event('mousemove'));
  };

  return (
    <>
      {children}
      
      <Modal
        isOpen={isWarningVisible}
        onClose={handleExtend}
        title="Session Expiring Soon"
        size="sm"
      >
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Clock className="text-amber-600 animate-pulse" size={32} />
          </div>
          <p className="text-slate-800 text-lg font-bold mb-2">Are you still there?</p>
          <p className="text-slate-600 mb-6 px-4">
            Your session will expire in <strong className="text-red-500 text-xl">{timeLeft}</strong> seconds due to inactivity.
          </p>
          <div className="flex gap-3 w-full">
            <Button variant="secondary" onClick={() => logout()} className="flex-1">
              Logout Now
            </Button>
            <Button variant="primary" onClick={handleExtend} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700">
              Extend Session
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SessionTimeout;
