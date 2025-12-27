import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AccessControl from './pages/AccessControl';
import AttackSimulation from './pages/AttackSimulation';
import SecurityLogs from './pages/SecurityLogs';
import { MockBackend } from './services/mockBackend';
import { ShieldAlert, Lock, Timer } from 'lucide-react';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [systemLock, setSystemLock] = useState({ locked: false, remaining: 0 });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Global System Status Polling
  useEffect(() => {
    const interval = setInterval(() => {
      const status = MockBackend.getSystemStatus();
      setSystemLock(status);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Audio Alert System for Lockout
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (systemLock.locked) {
      try {
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        // Main Oscillator (The "Voice")
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth'; // Harsh digital sound
        osc.frequency.setValueAtTime(800, ctx.currentTime);

        // Gain (Volume Control)
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, ctx.currentTime); // Keep it reasonable volume

        // LFO (Low Frequency Oscillator) for the "Pulse" effect
        // Creates the repeating pattern
        const lfo = ctx.createOscillator();
        lfo.type = 'square';
        lfo.frequency.setValueAtTime(4, ctx.currentTime); // 4Hz = Fast panic pulse

        // LFO controls the Gain (Volume) -> On/Off pulsing
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(1, ctx.currentTime);

        // Connect Modulator: LFO -> GainNode.gain
        // However, standard LFO to Gain modulation requires connecting to gain.gain
        // And usually needs offset.
        // Simplified approach: Just modulate frequency heavily for "Alarm" pitch shift

        // Let's do Pitch Modulation instead for a "Whoop" or "Digital Siren"
        // But for "Security Lockout" let's do frequency stepping.

        // Re-design for "Digital Lockout Pulse":
        // Two tones alternating: 600Hz and 800Hz quickly.

        const modulator = ctx.createOscillator();
        modulator.type = 'square';
        modulator.frequency.setValueAtTime(5, ctx.currentTime); // 5 times a second

        const modGain = ctx.createGain();
        modGain.gain.setValueAtTime(200, ctx.currentTime); // +/- 200Hz

        modulator.connect(modGain);
        modGain.connect(osc.frequency);
        modulator.start();

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

      } catch (e) {
        console.error("Audio playback failed", e);
      }
    } else {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(e => console.error("Error closing audio context", e));
        audioContextRef.current = null;
      }
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(e => console.error("Error closing audio context", e));
        audioContextRef.current = null;
      }
    };
  }, [systemLock.locked]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard isDarkMode={isDarkMode} />;
      case 'access': return <AccessControl />;
      case 'attacks': return <AttackSimulation />;
      case 'logs': return <SecurityLogs />;
      default: return <Dashboard isDarkMode={isDarkMode} />;
    }
  };

  return (
    <>
      <Layout
        activePage={activePage}
        onNavigate={setActivePage}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        systemLocked={systemLock.locked}
      >
        {renderPage()}
      </Layout>

      {/* GLOBAL SYSTEM LOCKDOWN OVERLAY */}
      {systemLock.locked && (
        <div className="fixed inset-0 z-50 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
          <div className="bg-red-900 border-2 border-red-500 rounded-2xl p-12 max-w-2xl text-center shadow-[0_0_100px_rgba(239,68,68,0.5)]">
            <div className="flex justify-center mb-6">
              <div className="bg-red-800 p-6 rounded-full border-4 border-red-400 animate-pulse">
                <ShieldAlert size={64} className="text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-black tracking-widest mb-2">SYSTEM LOCKED</h1>
            <p className="text-xl font-mono text-red-200 mb-8">SUSPECTED BIOMETRIC IDENTITY IMPERSONATION DETECTED</p>

            <div className="bg-black/40 rounded-lg p-6 border border-red-500/50 mb-8">
              <p className="text-sm text-red-300 mb-2 uppercase font-bold tracking-wider">Threat Containment Active</p>
              <div className="flex items-center justify-center space-x-3 text-3xl font-mono font-bold">
                <Timer className="animate-spin-slow" />
                <span>00:{systemLock.remaining.toString().padStart(2, '0')}</span>
              </div>
            </div>

            <div className="flex flex-col space-y-2 text-xs text-red-400 font-mono">
              <p>ACCESS CONTROL SUBSYSTEM: <span className="text-red-200">OFFLINE</span></p>
              <p>BIOMETRIC SENSORS: <span className="text-red-200">DISABLED</span></p>
              <p>ADMINISTRATIVE OVERRIDE: <span className="text-red-200">REQUIRED</span></p>
            </div>
          </div>
          <div className="absolute bottom-10 text-red-500/50 text-xs font-mono">
            SECURE_GATEWAY_ID: SG-084-ALPHA // LOCKDOWN_MODE: ACTIVE
          </div>
        </div>
      )}
    </>
  );
};

export default App;