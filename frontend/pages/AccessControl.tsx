import React, { useState, useRef, useEffect } from 'react';
import BiometricVisualizer from '../components/BiometricVisualizer';
import SystemLockdown from '../components/SystemLockdown';
import { MockBackend } from '../services/mockBackend';
import { BackendAPI } from '../services/api';
import { User } from '../types';
import { Camera, ScanFace, UserPlus, ChevronRight, CheckCircle2, ShieldCheck, RefreshCcw, Ban, Scan } from 'lucide-react';

const AccessControl: React.FC = () => {
    const [mode, setMode] = useState<'VERIFY' | 'ENROLL' | 'REGISTER'>('VERIFY');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState<User['role']>('USER');
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'MATCH' | 'NO_MATCH' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState('');
    const [similarity, setSimilarity] = useState<number | undefined>(undefined);
    const [cameraActive, setCameraActive] = useState(false);
    const [authResult, setAuthResult] = useState<{ authorized: boolean, user?: User } | null>(null);

    // Impersonation Lockout State
    const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [scanCooldown, setScanCooldown] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Timer Effect for Lockout
    useEffect(() => {
        let interval: any;
        if (lockoutEndTime) {
            interval = setInterval(() => {
                const remaining = Math.ceil((lockoutEndTime - Date.now()) / 1000);
                if (remaining <= 0) {
                    setLockoutEndTime(null);
                    setTimeRemaining(0);
                    setMessage("Lockout lifted. Verification allowed.");
                    setStatus('IDLE');
                } else {
                    setTimeRemaining(remaining);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [lockoutEndTime]);

    useEffect(() => {
        setAuthResult(null);
        setSimilarity(undefined);
        setStatus('IDLE');
        setMessage('');
        setUsername('');

        // Camera Logic
        if (mode !== 'REGISTER') {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [mode]);

    const startCamera = async () => {
        if (mode === 'REGISTER') return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
            streamRef.current = stream;
            setCameraActive(true);
        } catch (err) {
            setCameraActive(false);
            setStatus('ERROR');
            setMessage("Camera Unavailable");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    const captureFrame = async (): Promise<Blob | null> => {
        if (!videoRef.current || !cameraActive) return null;
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(videoRef.current, 0, 0);
        return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
    };

    const handleAction = async () => {
        if (lockoutEndTime || scanCooldown) return;
        if (mode !== 'VERIFY' && !username.trim()) { setStatus('ERROR'); setMessage("Username Required"); return; }

        if (mode !== 'REGISTER' && !cameraActive) { setStatus('ERROR'); setMessage("Sensor Offline"); return; }

        setStatus('SCANNING');
        setAuthResult(null);
        setMessage(mode === 'VERIFY' ? 'Authenticating...' : 'Processing...');

        try {
            await new Promise(r => setTimeout(r, 600));

            if (mode === 'REGISTER') {
                // Register
                await BackendAPI.registerUser(username, role);
                setStatus('IDLE');
                setMessage(`Identity '${username}' Created`);
            } else if (mode === 'ENROLL') {
                // Enrollment
                const frameBlob = await captureFrame();
                if (!frameBlob) throw new Error("Camera Capture Failed");

                await BackendAPI.enrollFace(username, frameBlob);

                setStatus('MATCH');
                setMessage('Biometrics Bound Successfully');
            } else {
                // Verification
                const frameBlob = await captureFrame();
                if (!frameBlob) throw new Error("Camera Capture Failed");

                const result = await BackendAPI.verifyFace(frameBlob);

                setSimilarity(result.similarity);
                if (result.authorized && result.user) {
                    const userObj: User = { id: 'remote', username: result.user.username, role: result.user.role as any, enrolled: true };
                    setAuthResult({ authorized: true, user: userObj });
                    setStatus('MATCH');
                    setMessage(result.message);
                } else {
                    setAuthResult({ authorized: false });
                    setStatus('NO_MATCH');
                    setMessage(result.message);
                }
            }
        } catch (e: any) {
            setStatus('ERROR');
            setMessage(e.message);
        } finally {
            if (mode === 'REGISTER') setTimeout(() => setMessage(''), 3000);
        }
    };

    const getSteps = () => {
        if (mode === 'VERIFY') return ['Identification', 'Biometric Scan', 'Access Decision'];
        if (mode === 'ENROLL') return ['Identity Lookup', 'Capture Face', 'Template Binding'];
        return ['User Details', 'Role Assignment', 'Record Creation'];
    };

    const currentStep = () => {
        if (authResult || status === 'MATCH') return 3;
        if (status === 'SCANNING') return 2;
        if (username) return 1;
        return 0;
    };

    return (
        <div className="h-full flex flex-col relative">
            {lockoutEndTime && (
                <SystemLockdown
                    retryAfter={timeRemaining}
                    onUnlock={() => {
                        setLockoutEndTime(null);
                        setTimeRemaining(0);
                        setMessage("Lockout lifted. Verification allowed.");
                        setStatus('IDLE');
                    }}
                />
            )}
            <canvas ref={canvasRef} width="32" height="24" className="hidden" />

            {/* Top Controls */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white text-gray-900 tracking-tight">Access Control</h2>
                    <p className="text-zinc-500 text-sm mt-1">Manage identities and enforce physical security policies.</p>
                </div>

                <div className="dark:bg-zinc-900 bg-white p-1 rounded-lg border dark:border-zinc-800 border-gray-200 flex shadow-sm">
                    {(['VERIFY', 'ENROLL', 'REGISTER'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`px-6 py-2 rounded-md text-xs font-bold transition-all duration-200 ${mode === m
                                ? 'dark:bg-zinc-100 bg-gray-900 dark:text-zinc-900 text-white shadow-sm'
                                : 'text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

                {/* LEFT: CONTROL PLANE */}
                <div className="lg:col-span-4 flex flex-col space-y-4">

                    {/* Progress Stepper */}
                    <div className="flex justify-between items-center px-2">
                        {getSteps().map((label, idx) => {
                            const active = idx <= currentStep();
                            return (
                                <div key={label} className="flex flex-col items-center">
                                    <div className={`w-2 h-2 rounded-full mb-1 transition-colors duration-300 ${active ? 'bg-emerald-500' : 'dark:bg-zinc-800 bg-gray-300'}`}></div>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${active ? 'dark:text-zinc-300 text-gray-800' : 'text-zinc-500'}`}>{label}</span>
                                </div>
                            )
                        })}
                    </div>

                    {/* Input Card */}
                    <div className={`dark:bg-zinc-900/50 bg-white border ${lockoutEndTime ? 'border-red-500 dark:border-red-800' : 'dark:border-zinc-800 border-gray-200'} rounded-xl p-6 shadow-sm flex flex-col space-y-5 relative overflow-hidden transition-colors`}>

                        {mode === 'VERIFY' && !lockoutEndTime && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600"></div>
                        )}

                        <div className={`flex items-center space-x-3 dark:text-zinc-100 text-gray-900 mb-2 ${lockoutEndTime ? 'mt-6' : ''}`}>
                            <div className="p-2 dark:bg-zinc-800 bg-gray-100 rounded-lg">
                                {mode === 'VERIFY' ? <ScanFace size={20} className="text-blue-500" /> : mode === 'REGISTER' ? <UserPlus size={20} className="text-indigo-500" /> : <Scan size={20} className="text-zinc-500" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">{mode === 'VERIFY' ? 'Authentication' : mode === 'REGISTER' ? 'New Identity' : 'Enrollment'}</h3>
                                <p className="text-xs text-zinc-500">
                                    {mode === 'VERIFY' ? 'Security Level: Biometric (L1)' : mode === 'REGISTER' ? 'HR / Admin Mode' : 'Template Generation'}
                                </p>
                            </div>
                        </div>

                        {mode !== 'VERIFY' && (
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Username / Identifier</label>
                                <input
                                    value={username}
                                    disabled={!!lockoutEndTime}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full dark:bg-zinc-950 bg-gray-50 border dark:border-zinc-700 border-gray-300 rounded-lg px-4 py-3 text-sm dark:text-white text-gray-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-400 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="e.g. j_doe"
                                />
                            </div>
                        )}

                        {/* Sensor Status Indicators */}
                        {mode !== 'REGISTER' && !lockoutEndTime && (
                            <div className="flex space-x-2 text-[10px] uppercase font-bold tracking-wider opacity-50">
                                <span>Server-Side Analysis Active</span>
                            </div>
                        )}

                        {mode === 'REGISTER' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Security Clearance</label>
                                <div className="relative">
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as any)}
                                        className="w-full dark:bg-zinc-950 bg-gray-50 border dark:border-zinc-700 border-gray-300 rounded-lg px-4 py-3 text-sm dark:text-white text-gray-900 focus:border-emerald-500 outline-none appearance-none"
                                    >
                                        <option value="USER">Standard User (L1)</option>
                                        <option value="SECURITY_ENGINEER">Security Engineer (L2)</option>
                                        <option value="ADMIN">Administrator (L3)</option>
                                    </select>
                                    <ChevronRight className="absolute right-3 top-3.5 text-zinc-600 rotate-90" size={14} />
                                </div>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                onClick={() => handleAction()}
                                disabled={status === 'SCANNING' || !!lockoutEndTime || scanCooldown}
                                className={`w-full py-3.5 rounded-lg font-bold text-sm shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center space-x-2 ${lockoutEndTime || scanCooldown ? 'bg-red-900/30 text-red-500 border border-red-900 cursor-not-allowed' :
                                    status === 'SCANNING' ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' :
                                        mode === 'VERIFY' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20' :
                                            mode === 'REGISTER' ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20' :
                                                'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                                    }`}
                            >
                                {status === 'SCANNING' && <Camera className="animate-spin" size={16} />}
                                {lockoutEndTime && <Ban size={16} />}
                                <span>{
                                    lockoutEndTime ? 'LOCKED OUT' :
                                        status === 'SCANNING' ? 'Processing...' :
                                            scanCooldown ? 'COOLDOWN...' :
                                                mode === 'VERIFY' ? 'Scan & Verify' :
                                                    mode === 'REGISTER' ? 'Create Record' : 'Capture Face'
                                }</span>
                            </button>
                            {message && (
                                <div className={`mt-3 p-2 rounded text-center text-xs font-mono border ${status === 'ERROR' || message.includes('Hold') || message.includes('dark') ? 'bg-red-900/20 border-red-900/50 text-red-400' : 'dark:bg-zinc-900 bg-gray-50 dark:border-zinc-800 border-gray-200 text-zinc-400'}`}>
                                    {message}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Enterprise Footer Info */}
                    <div className="text-center text-[10px] text-zinc-500 mt-auto">
                        <p>SECURE GATEWAY NODE ID: SG-084-ALPHA</p>
                        <p>ENFORCEMENT: STRICT • LOGGING: ACTIVE</p>
                    </div>
                </div>

                {/* RIGHT: DATA PLANE */}
                <div className="lg:col-span-8 flex flex-col relative h-full min-h-[400px]">

                    {/* Biometric Feed / Result Card */}
                    <div className="relative flex-1 bg-black rounded-xl overflow-hidden border dark:border-zinc-800 border-zinc-200 shadow-2xl">

                        {mode === 'REGISTER' ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 dark:bg-zinc-950 bg-gray-50 transition-colors">
                                <UserPlus size={64} className="mb-4 opacity-50" />
                                <h3 className="text-lg font-medium text-zinc-400">Registration Mode</h3>
                                <p className="text-sm text-zinc-500">Biometric sensors are currently disabled.</p>
                            </div>
                        ) : (
                            <>
                                <video ref={videoRef} autoPlay muted playsInline className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${cameraActive ? 'opacity-60' : 'opacity-0'}`} />
                                <div className="absolute inset-0 z-10">
                                    <BiometricVisualizer
                                        state={status}
                                        score={similarity}
                                        transparent
                                        stability={100} // Force stable for UI
                                        aligned={true} // Force aligned
                                    />
                                </div>
                            </>
                        )}

                        {/* AUTHENTICATION RESULT OVERLAY */}
                        {authResult && (
                            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in zoom-in duration-300">
                                <div className={`w-96 dark:bg-zinc-900 bg-white rounded-xl overflow-hidden shadow-2xl border-2 transform transition-all duration-500 ${authResult.authorized ? 'border-emerald-500' : 'border-red-500'}`}>
                                    {/* Card Header */}
                                    <div className={`h-28 flex flex-col items-center justify-center ${authResult.authorized ? 'bg-emerald-600' : 'bg-red-600'}`}>
                                        {authResult.authorized ? <CheckCircle2 size={56} className="text-white drop-shadow-lg" /> : <ShieldCheck size={56} className="text-white drop-shadow-lg" />}
                                        <h3 className="text-2xl font-bold text-white mt-2 tracking-tight">
                                            {authResult.authorized ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                                        </h3>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-8 text-center space-y-4">
                                        {authResult.user ? (
                                            <div>
                                                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Identity Verified</p>
                                                <p className="text-3xl dark:text-white text-gray-900 font-mono font-bold">{authResult.user.username}</p>
                                                <div className="flex justify-center mt-2">
                                                    <span className="px-3 py-1 dark:bg-zinc-800 bg-gray-100 rounded-full text-xs dark:text-zinc-300 text-gray-700 border dark:border-zinc-700 border-gray-300 font-mono">
                                                        ROLE: {authResult.user.role}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-sm dark:text-zinc-300 text-gray-700 font-bold">Biometric Verification Failed</p>
                                                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                                                    The presented biometric data does not match any enrolled identity with sufficient confidence.
                                                </p>
                                            </div>
                                        )}

                                        {!authResult.authorized && (
                                            <div className="bg-red-900/20 border border-red-900/50 rounded p-3 text-xs text-red-500 font-mono mt-4">
                                                Error Code: 0xBIO_MISMATCH
                                                <br />Confidence Score: {(similarity || 0).toFixed(4)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Action */}
                                    <div className="dark:bg-zinc-950 bg-gray-50 p-4 border-t dark:border-zinc-800 border-gray-200 flex justify-center">
                                        <button onClick={() => { setAuthResult(null); setStatus('IDLE'); }} className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-white flex items-center transition-colors">
                                            <RefreshCcw size={12} className="mr-2" />
                                            RETURN TO SCANNER
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AccessControl;