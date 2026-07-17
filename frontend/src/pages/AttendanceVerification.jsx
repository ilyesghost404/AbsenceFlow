import { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, RefreshCw, Clock, Users, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { createQr, getTodayAttendance } from '../services/presenceService';

const AttendanceVerification = () => {
  const [qrToken, setQrToken] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);

  const countdownTimerRef = useRef(null);
  const logsPollTimerRef = useRef(null);

  // Fetch a new QR code session
  const generateNewQR = async () => {
    try {
      setQrLoading(true);
      const data = await createQr();
      if (data.success) {
        setQrToken(data.qrToken);
        const expiry = new Date(data.expiresAt);
        setExpiresAt(expiry);
        
        // Calculate remaining seconds
        const diffMs = expiry.getTime() - Date.now();
        const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
        setTimeLeft(diffSecs);
      }
    } catch (error) {
      console.error('Failed to generate QR session:', error);
      toast.error('Failed to generate verification QR code');
    } finally {
      setQrLoading(false);
    }
  };

  // Fetch today's attendance logs
  const fetchTodayLogs = async () => {
    try {
      const response = await getTodayAttendance({ page: 1, limit: 100, search: '' });
      // Only keep records that have check-in times (i.e. logged today)
      const checkedInToday = (response.data || []).filter(r => r.check_in);
      setLogs(checkedInToday);
    } catch (error) {
      console.error('Failed to fetch today logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  // Lifecycle for QR Code generation and countdown
  useEffect(() => {
    generateNewQR();
    fetchTodayLogs();

    // Set up logs polling every 5 seconds for real-time verification logs
    logsPollTimerRef.current = setInterval(fetchTodayLogs, 5000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (logsPollTimerRef.current) clearInterval(logsPollTimerRef.current);
    };
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Token expired, trigger auto-refresh
          generateNewQR();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [expiresAt]);

  const handleManualRefresh = () => {
    generateNewQR();
    toast.success('QR Code refreshed successfully');
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <QrCode className="text-blue-600" size={28} />
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Attendance Verification Portal</h1>
        </div>
        <p className="text-slate-500 font-medium mt-1">Display this screen to allow employees to check in/out using face and QR verification</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: QR Code Panel */}
        <Card className="lg:col-span-5 border-slate-200 shadow-sm flex flex-col items-center p-8 text-center bg-white/70 backdrop-blur-md">
          <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Clock size={20} className="text-blue-500" />
            Dynamic QR Scanner Token
          </h3>
          <p className="text-slate-400 text-xs mb-6">Employees must scan this QR code after verifying their face</p>
          
          {/* QR Display Area */}
          <div className="relative p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center aspect-square w-full max-w-[280px] shadow-inner mb-6">
            {qrLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-3xl z-10">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            ) : null}

            {qrToken ? (
              <QRCodeCanvas 
                value={qrToken} 
                size={220} 
                level="H" 
                includeMargin={false}
                className="rounded-lg shadow-sm"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <AlertCircle size={32} />
                <span className="text-xs">No QR Code Active</span>
              </div>
            )}
          </div>

          {/* Timer and Cooldown Progress */}
          <div className="w-full max-w-[280px] space-y-4 mb-6">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
              <span>Token Expires In</span>
              <span className={`font-mono text-sm font-bold ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>
                {timeLeft}s
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-rose-500' : 'bg-blue-600'}`}
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              />
            </div>
          </div>

          <Button 
            variant="primary" 
            onClick={handleManualRefresh}
            disabled={qrLoading}
            className="w-full max-w-[280px] justify-center rounded-xl font-bold py-3 shadow-md shadow-blue-500/10"
            icon={RefreshCw}
          >
            Refresh QR Code
          </Button>
        </Card>

        {/* Right Side: Real-Time Logs */}
        <Card className="lg:col-span-7 border-slate-200 shadow-sm flex flex-col h-full bg-white/70 backdrop-blur-md" noPadding>
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users size={20} className="text-blue-500" />
              Real-time Verification Logs
            </h3>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              Live Monitoring
            </span>
          </div>

          <div className="p-6 flex-1 min-h-[400px] overflow-y-auto max-h-[500px] custom-scrollbar">
            {logsLoading ? (
              <div className="py-20 text-center">
                <LoadingSpinner size="lg" />
                <p className="text-slate-400 text-xs font-semibold mt-4">Setting up logging monitor...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-semibold flex flex-col items-center justify-center gap-2">
                <Users size={32} />
                <span>Waiting for employees to check in/out...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log, idx) => {
                  const checkTime = log.check_out || log.check_in;
                  const isCheckOut = !!log.check_out;
                  return (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/50 transition-colors animate-in slide-in-from-bottom-2 duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-r from-blue-500 to-indigo-600`}>
                          {(log.first_name || '')[0] || ''}{(log.last_name || '')[0] || ''}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {log.first_name} {log.last_name}
                          </p>
                          <p className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider">
                            Matricule: {log.matricule}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* AI Match score info */}
                        {log.face_confidence && (
                          <div className="text-right hidden sm:block">
                            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Face Match</span>
                            <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-0.5">
                              <Sparkles size={10} /> {Math.round(log.face_confidence)}%
                            </span>
                          </div>
                        )}
                        
                        {/* Check-in / check-out status */}
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                            isCheckOut ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {isCheckOut ? 'Checked Out' : 'Checked In'}
                            <span className="font-mono text-[10px] font-bold opacity-80">
                              ({formatTime(checkTime)})
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};

export default AttendanceVerification;
