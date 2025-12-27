import React, { useEffect, useState } from 'react';
import { ShieldAlert, Ban, Siren, Lock } from 'lucide-react';

interface SystemLockdownProps {
    retryAfter: number;
    onUnlock: () => void;
}

const SystemLockdown: React.FC<SystemLockdownProps> = ({ retryAfter, onUnlock }) => {
    const [timeLeft, setTimeLeft] = useState(retryAfter);

    useEffect(() => {
        // --- AUDIO ALARM SYSTEM ---
        let audioCtx: AudioContext | null = null;
        let osc: OscillatorNode | null = null;
        let gain: GainNode | null = null;
        let lfo: OscillatorNode | null = null;

        const startAlarm = () => {
            try {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                if (!AudioContext) return;

                audioCtx = new AudioContext();
                osc = audioCtx.createOscillator();
                gain = audioCtx.createGain();
                lfo = audioCtx.createOscillator();
                const lfoGain = audioCtx.createGain();

                // Siren Pattern
                osc.type = 'sawtooth';
                osc.frequency.value = 800; // Base freq

                lfo.type = 'sawtooth';
                lfo.frequency.value = 2; // Modulate 2 times per second
                lfoGain.gain.value = 400; // Modulate by +/- 400Hz

                // Wiring
                lfo.connect(lfoGain);
                lfoGain.connect(osc.frequency);
                osc.connect(gain);
                gain.connect(audioCtx.destination);

                // Volume and Start
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 1); // Fade in

                osc.start();
                lfo.start();
            } catch (e) {
                console.error("Audio Alarm Failed:", e);
            }
        };

        // User interaction is usually required to play audio. 
        // Assuming this component mounts after a user click (failed auth), the context might be allowed.
        startAlarm();

        // --- COUNTDOWN TIMER ---
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onUnlock();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(interval);
            if (osc) {
                try {
                    osc.stop();
                    osc.disconnect();
                } catch (e) { }
            }
            if (lfo) lfo.stop();
            if (audioCtx) audioCtx.close();
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-red-950 flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
            {/* Pulsing Background */}
            <div className="absolute inset-0 bg-red-600/20 animate-pulse"></div>

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-20"
                style={{ backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 50%)', backgroundSize: '100% 4px' }}>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-2xl">

                {/* Warning Icon */}
                <div className="relative">
                    <div className="absolute inset-0 bg-red-500 blur-3xl opacity-40 animate-pulse rounded-full"></div>
                    <ShieldAlert size={120} className="text-red-500 animate-bounce relative z-10" />
                </div>

                {/* Main Text */}
                <div className="space-y-4">
                    <h1 className="text-6xl font-black text-white tracking-widest uppercase font-mono drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">
                        System Locked
                    </h1>
                    <p className="text-xl text-red-200 font-mono border-t border-b border-red-800 py-4">
                        SECURITY THREAT DETECTED • ACCESS SUSPENDED
                    </p>
                </div>

                {/* Timer Box */}
                <div className="bg-black/50 backdrop-blur-md rounded-2xl border-2 border-red-500/50 p-8 min-w-[300px] shadow-2xl">
                    <div className="flex items-center justify-center space-x-3 text-red-500 mb-2">
                        <Lock size={20} />
                        <span className="text-sm font-bold tracking-widest uppercase">Lockdown Active</span>
                    </div>
                    <div className="text-7xl font-bold text-white font-mono tabular-nums tracking-tight">
                        00:{timeLeft.toString().padStart(2, '0')}
                    </div>
                    <p className="text-red-400 text-xs mt-4 animate-pulse">
                        PLEASE CONTACT SECURITY ADMINISTRATION
                    </p>
                </div>

                <div className="flex items-center space-x-2 text-red-800/50 font-mono text-sm">
                    <Siren className="animate-spin" size={16} />
                    <span>AUDIO ALARM ACTIVE - EVENT LOGGED [ERR_992]</span>
                </div>
            </div>
        </div>
    );
};

export default SystemLockdown;
