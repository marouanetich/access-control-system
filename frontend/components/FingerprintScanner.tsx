import React, { useEffect, useState } from 'react';
import { Fingerprint, Scan, CheckCircle2, XCircle, RefreshCcw } from 'lucide-react';

interface FingerprintScannerProps {
    state: 'IDLE' | 'SCANNING' | 'MATCH' | 'NO_MATCH' | 'ERROR';
    onScanComplete: (embedding: number[]) => void;
    disabled?: boolean;
}

const FingerprintScanner: React.FC<FingerprintScannerProps> = ({ state, onScanComplete, disabled }) => {
    const [scanProgress, setScanProgress] = useState(0);

    // WebAuthn Simulation / Integration
    useEffect(() => {
        if (state === 'SCANNING' && !disabled) {
            // In a real scenario, this component might just be a visualizer 
            // while the parent page handles the async WebAuthn calls. 
            // However, for this visual feedback loop:
            setScanProgress(0);
            const interval = setInterval(() => {
                setScanProgress(p => p < 90 ? p + 2 : p);
            }, 50);

            return () => clearInterval(interval);
        } else {
            setScanProgress(0);
        }
    }, [state, disabled]);

    return (
        <div className={`relative w-full h-full min-h-[400px] flex flex-col items-center justify-center transition-colors duration-500 overflow-hidden rounded-xl border-2 
      ${state === 'MATCH' ? 'bg-emerald-950/30 border-emerald-500/50' :
                state === 'NO_MATCH' || state === 'ERROR' ? 'bg-red-950/30 border-red-500/50' :
                    'dark:bg-zinc-950 bg-gray-50 dark:border-zinc-800 border-gray-200'}`}>

            {/* Background Grid Effect */}
            <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle, #888 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Scanner HUD */}
                <div className={`relative w-64 h-64 border-2 rounded-full flex items-center justify-center mb-8 transition-all duration-500
          ${state === 'SCANNING' ? 'border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.3)]' :
                        state === 'MATCH' ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.4)]' :
                            state === 'NO_MATCH' ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)]' :
                                'border-zinc-700'}`}>

                    {/* Animated Scan Line */}
                    {state === 'SCANNING' && (
                        <div className="absolute w-full h-1 bg-blue-500 shadow-[0_0_10px_#3b82f6] top-0 animate-[scan_1.5s_linear_infinite]" />
                    )}

                    {/* Fingerprint Icon */}
                    <Fingerprint
                        size={120}
                        strokeWidth={0.5}
                        className={`transition-all duration-500
               ${state === 'SCANNING' ? 'text-blue-500 animate-pulse' :
                                state === 'MATCH' ? 'text-emerald-500' :
                                    state === 'NO_MATCH' ? 'text-red-500' :
                                        disabled ? 'text-zinc-800' : 'text-zinc-600'}`}
                    />

                    {state === 'MATCH' && <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in"><CheckCircle2 size={80} className="text-emerald-500 bg-black/50 rounded-full" /></div>}
                    {state === 'NO_MATCH' && <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in"><XCircle size={80} className="text-red-500 bg-black/50 rounded-full" /></div>}
                </div>

                {/* Status Text */}
                <div className="text-center space-y-2">
                    <h3 className={`text-2xl font-bold tracking-wider uppercase font-mono
              ${state === 'MATCH' ? 'text-emerald-500' :
                            state === 'NO_MATCH' ? 'text-red-500' :
                                'dark:text-zinc-400 text-gray-600'}`}>
                        {state === 'IDLE' ? 'Place Finger on Sensor' :
                            state === 'SCANNING' ? `Scanning... ${scanProgress}%` :
                                state === 'MATCH' ? 'Identity Confirmed' :
                                    state === 'NO_MATCH' ? 'Access Denied' : 'Sensor Error'}
                    </h3>
                    <p className="text-xs text-zinc-500">
                        {disabled ? 'Biometric Module Disabled' : 'Touch ID Sensor Ready (v2.4)'}
                    </p>
                </div>
            </div>

            {/* Footer instruction */}
            {state === 'IDLE' && !disabled && (
                <div className="absolute bottom-10 animate-bounce text-zinc-600">
                    <Scan size={24} />
                </div>
            )}

            {/* CSS for Scan Animation */}
            <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
        </div>
    );
};

export default FingerprintScanner;
