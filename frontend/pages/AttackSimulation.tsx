import React, { useState, useEffect } from 'react';
import { AttackType, User } from '../types';
import { BackendAPI } from '../services/api';
import { MockBackend } from '../services/mockBackend';
import { Shield, RefreshCw, AlertTriangle, Key, Unlock, UserX, Network, Terminal, Play, Info, AlertOctagon } from 'lucide-react';

const AttackSimulation: React.FC = () => {
  const [selectedAttack, setSelectedAttack] = useState<AttackType | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [targetUser, setTargetUser] = useState('');
  const [securityLevel, setSecurityLevel] = useState<'LOW' | 'HIGH'>('LOW');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await BackendAPI.getUsers();
        setAvailableUsers(users);
        if (users.length > 0) setTargetUser(users[0].id);
      } catch (e) {
        console.error("Failed to fetch users", e);
      }
    };
    fetchUsers();
  }, []);

  const addToConsole = (msg: string) => {
    setConsoleOutput(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const runAttack = async () => {
    if (!selectedAttack) return;
    if (!targetUser && availableUsers.length === 0) {
      addToConsole(`[!] ERROR: No users found.`);
      return;
    }

    setIsRunning(true);
    setConsoleOutput([]);
    addToConsole(`>>> INIT_MODULE: ${selectedAttack}`);
    addToConsole(`>>> TARGET: ${targetUser}`);
    addToConsole(`>>> DEFENSE_PROFILE: ${securityLevel}`);

    try {
      if (selectedAttack === AttackType.REPLAY) {
        addToConsole("[*] Listening for traffic...");
        const users = await BackendAPI.getUsers();
        const user = users.find(u => u.id === targetUser);
        if (user && user.biometricTemplate) {
          // Note: biometricTemplate structure might differ in Python backend
          // but for simulation purposes we are just mocking packet capture here
          // or we should fetch template from backend if possible.
          // For now, let's mock the capture as "Success" if user exists.
          addToConsole(`[+] PACKET_CAP: 128xFloat32`);
        } else {
          // If user has no template (e.g. not enrolled), we might fail.
          // In real backend, we check users_db[targetUser].embedding
          if (targetUser) {
            addToConsole(`[+] PACKET_CAP: 128xFloat32 (Simulated)`);
          } else {
            addToConsole("[-] ERR: No enrollment data found.");
            setIsRunning(false);
            return;
          }
        }
      }

      addToConsole("[*] Injecting payload (Backend-Driven)...");
      const result = await BackendAPI.executeThreatSimulation(selectedAttack, targetUser, securityLevel);

      addToConsole(`----------------------------------------`);
      if (result.success) {
        addToConsole(`[+] EXPLOIT_SUCCESS`);
        addToConsole(`[>] MSG: ${result.message}`);
      } else {
        addToConsole(`[-] ATTACK_BLOCKED`);
        addToConsole(`[<] RESPONSE: ${result.message}`);
      }
    } catch (e: any) {
      addToConsole(`[!] EXCEPTION: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const attacks = [
    { id: AttackType.REPLAY, icon: RefreshCw, label: 'Replay Attack', desc: 'Re-broadcast captured packets.', mitigation: 'Timestamp + Nonce validation prevents reuse of old packets.' },
    { id: AttackType.SESSION_HIJACKING, icon: Network, label: 'Session Hijacking', desc: 'Token theft via XSS/MitM.', mitigation: 'Geo-IP binding and User-Agent fingerprinting lock sessions.' },
    { id: AttackType.TAMPERING, icon: AlertTriangle, label: 'Integrity Violation', desc: 'Direct DB hash modification.', mitigation: 'HMAC/Hashing of templates detects unauthorized changes.' },
    { id: AttackType.UNAUTHORIZED_ENROLLMENT, icon: UserX, label: 'Shadow Enrollment', desc: 'BOLA vulnerability exploit.', mitigation: 'Strict Identity Reference Checks (BOLA Protection).' },
    { id: AttackType.BRUTE_FORCE, icon: Key, label: 'Brute Force', desc: 'High-speed vector injection.', mitigation: 'Rate Limiting (Token Bucket) and Account Lockout.' },
    { id: AttackType.THRESHOLD_MANIPULATION, icon: Unlock, label: 'Config Injection', desc: 'Parameter tampering.', mitigation: 'Read-only Configuration & Input Validation.' },
  ];

  return (
    <div className="h-full flex flex-col space-y-4">

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">

        {/* LEFT: CONFIGURATION & VECTORS */}
        <div className="lg:w-1/2 flex flex-col space-y-6 overflow-hidden">

          {/* Header / Config */}
          <div className="dark:bg-zinc-900/50 bg-white border dark:border-zinc-800 border-gray-200 p-6 rounded-xl shadow-sm transition-colors">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="text-red-500" />
              <h2 className="text-lg font-bold dark:text-white text-gray-900">Adversary Emulation</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Target Identity</label>
                <select
                  value={targetUser}
                  onChange={e => setTargetUser(e.target.value)}
                  className="w-full dark:bg-zinc-950 bg-gray-50 border dark:border-zinc-700 border-gray-300 rounded-lg p-2.5 text-sm dark:text-zinc-200 text-gray-900 outline-none focus:border-red-500"
                >
                  {availableUsers.length === 0 && <option>No Users Found</option>}
                  {availableUsers.map(u => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Defense Profile</label>
                <div className="flex dark:bg-zinc-950 bg-gray-50 rounded-lg p-1 border dark:border-zinc-700 border-gray-300">
                  <button onClick={() => setSecurityLevel('LOW')} className={`flex-1 py-1.5 text-xs font-bold rounded ${securityLevel === 'LOW' ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'text-zinc-500'}`}>LOW</button>
                  <button onClick={() => setSecurityLevel('HIGH')} className={`flex-1 py-1.5 text-xs font-bold rounded ${securityLevel === 'HIGH' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>HIGH</button>
                </div>
              </div>
            </div>
          </div>

          {/* Attack Grid */}
          <div className="grid grid-cols-2 gap-3 flex-1 overflow-auto pr-1">
            {attacks.map((att) => (
              <button
                key={att.id}
                onClick={() => setSelectedAttack(att.id)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 group flex flex-col justify-between min-h-[100px] shadow-sm ${selectedAttack === att.id
                  ? 'bg-red-600 text-white border-red-500 shadow-red-900/20'
                  : 'dark:bg-zinc-900/40 bg-white dark:border-zinc-800 border-gray-200 text-zinc-400 dark:hover:bg-zinc-800 hover:bg-gray-50 hover:border-gray-300'
                  }`}
              >
                <att.icon size={20} className={`mb-2 ${selectedAttack === att.id ? 'text-white' : 'text-zinc-500 group-hover:text-red-500'}`} />
                <div>
                  <div className={`font-bold text-sm leading-tight ${selectedAttack === att.id ? 'text-white' : 'dark:text-zinc-300 text-gray-700'}`}>{att.label}</div>
                  <div className={`text-[10px] mt-1 ${selectedAttack === att.id ? 'text-red-100' : 'text-zinc-500'}`}>{att.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Tactical Analysis Panel */}
          <div className="dark:bg-zinc-950 bg-white border dark:border-zinc-800 border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2 text-zinc-400">
              <Info size={14} />
              <span className="text-xs font-bold uppercase">Tactical Defense Analysis</span>
            </div>
            <div className="text-xs text-zinc-500 h-10">
              {selectedAttack ? (
                <span>
                  <strong className="dark:text-zinc-300 text-gray-800">Mitigation Strategy:</strong> {attacks.find(a => a.id === selectedAttack)?.mitigation}
                </span>
              ) : (
                <span className="italic">Select an attack vector above to view specific mitigation strategies employed by the High Security profile.</span>
              )}
            </div>
          </div>

          {/* Execute Button */}
          <button
            onClick={runAttack}
            disabled={!selectedAttack || isRunning || availableUsers.length === 0}
            className="w-full dark:bg-zinc-100 bg-gray-900 hover:bg-black dark:hover:bg-white text-white dark:text-black py-4 rounded-lg font-bold shadow-lg shadow-black/5 dark:shadow-white/5 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isRunning ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
            <span>{isRunning ? 'EXECUTION IN PROGRESS...' : 'EXECUTE ATTACK VECTOR'}</span>
          </button>
        </div>

        {/* RIGHT: FORENSIC LOG (Keep Dark Mode Aesthetic for Terminal) */}
        <div className="lg:w-1/2 bg-black rounded-xl border dark:border-zinc-800 border-gray-800 overflow-hidden flex flex-col shadow-2xl">
          <div className="h-10 bg-zinc-900/50 border-b border-zinc-800 flex items-center px-4 justify-between">
            <div className="flex items-center space-x-2 text-zinc-400">
              <Terminal size={14} />
              <span className="text-xs font-mono font-bold">FORENSIC_LOG</span>
            </div>
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
            </div>
          </div>

          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1.5 text-zinc-300">
            {consoleOutput.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-2">
                <Shield size={32} />
                <p>Awaiting Command Input...</p>
              </div>
            )}
            {consoleOutput.map((line, i) => (
              <div key={i} className={`break-all ${line.includes('SUCCESS') ? 'text-emerald-400' :
                line.includes('BLOCKED') ? 'text-blue-400' :
                  line.includes('ERROR') || line.includes('EXCEPTION') ? 'text-red-400' :
                    line.includes('>>>') ? 'text-zinc-500 border-b border-zinc-900 pb-1 mt-2' : ''
                }`}>
                {line}
              </div>
            ))}
            {isRunning && <div className="animate-pulse text-red-500">_</div>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AttackSimulation;