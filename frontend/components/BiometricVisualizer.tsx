import React, { useEffect, useState } from 'react';

interface BiometricVisualizerProps {
  state: 'IDLE' | 'SCANNING' | 'MATCH' | 'NO_MATCH' | 'ERROR';
  score?: number;
  transparent?: boolean;
  stability?: number; // 0-100
  aligned?: boolean;
}

const BiometricVisualizer: React.FC<BiometricVisualizerProps> = ({ state, score, transparent = false, stability = 0, aligned = false }) => {
  const [nodes, setNodes] = useState<{x: number, y: number}[]>([]);

  useEffect(() => {
    const newNodes = Array.from({ length: 40 }, () => ({
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 70,
    }));
    setNodes(newNodes);
  }, []);

  const getColor = () => {
    if (state === 'MATCH') return '#10b981'; // Emerald
    if (state === 'NO_MATCH' || state === 'ERROR') return '#ef4444'; // Red
    if (state === 'SCANNING') return '#3b82f6'; // Blue
    if (state === 'IDLE' && aligned) return '#10b981'; // Green when locked/aligned
    return '#71717a'; // Zinc 500
  };

  const statusText = state === 'IDLE' ? (aligned ? 'ACQUISITION LOCKED' : 'SEARCHING...') : state;

  return (
    <div className={`relative w-full h-full min-h-[300px] overflow-hidden flex items-center justify-center ${!transparent ? 'dark:bg-zinc-950 bg-gray-50 border dark:border-zinc-800 border-gray-200 rounded-lg' : ''}`}>
      
      {/* Scanning Line Animation */}
      {state === 'SCANNING' && (
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-[scan_2s_linear_infinite] z-20"></div>
      )}

      {/* Stability Progress Bar (Vertical) */}
      <div className="absolute left-4 bottom-20 top-20 w-1 bg-zinc-800 rounded-full overflow-hidden z-20">
         <div 
           className="w-full bg-emerald-500 transition-all duration-200 ease-out"
           style={{ height: `${stability}%`, marginTop: `${100 - stability}%` }}
         />
      </div>

      {/* HUD Overlay SVG */}
      <svg className="w-full h-full absolute inset-0 z-10 pointer-events-none" viewBox="0 0 100 100">
        
        {/* Facial Mesh */}
        {state !== 'IDLE' && (
            <g opacity={state === 'SCANNING' ? "0.8" : "0.4"}>
            {nodes.map((node, i) => (
                <circle
                key={i}
                cx={node.x}
                cy={node.y}
                r="0.5"
                fill={getColor()}
                className="transition-colors duration-300"
                />
            ))}
            {/* Connections */}
            {nodes.slice(0, 20).map((node, i) => (
                <path
                key={`path-${i}`}
                d={`M${node.x} ${node.y} L${nodes[(i + 1) % 20].x} ${nodes[(i + 1) % 20].y}`}
                stroke={getColor()}
                strokeWidth="0.1"
                opacity="0.3"
                />
            ))}
            </g>
        )}

        {/* Reticle / Frame */}
        <g stroke={getColor()} strokeWidth="0.5" fill="none" className="transition-colors duration-300">
            {/* Corners */}
            <path d="M 10 30 V 10 H 30" />
            <path d="M 70 10 H 90 V 30" />
            <path d="M 90 70 V 90 H 70" />
            <path d="M 30 90 H 10 V 70" />
            
            {/* Center Crosshair */}
            <line x1="45" y1="50" x2="55" y2="50" strokeOpacity={aligned ? "1" : "0.2"} />
            <line x1="50" y1="45" x2="50" y2="55" strokeOpacity={aligned ? "1" : "0.2"} />
        </g>
      </svg>

      {/* Info Overlay */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-30">
         <div className="dark:bg-zinc-900/90 bg-white/90 border dark:border-zinc-700 border-gray-200 backdrop-blur px-4 py-2 rounded-full flex items-center space-x-3 shadow-xl">
            <div className={`w-2 h-2 rounded-full ${state === 'SCANNING' ? 'bg-blue-500 animate-pulse' : state === 'MATCH' ? 'bg-emerald-500' : state === 'NO_MATCH' ? 'bg-red-500' : aligned ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`}></div>
            <span className="font-mono text-xs font-bold dark:text-zinc-200 text-gray-800 tracking-wider">{statusText}</span>
            {score !== undefined && (
                 <>
                    <div className="w-px h-3 dark:bg-zinc-700 bg-gray-300"></div>
                    <span className={`font-mono text-xs ${score > 0.8 ? 'text-emerald-500' : 'text-zinc-500'}`}>
                        CONF: {(score * 100).toFixed(1)}%
                    </span>
                 </>
            )}
         </div>
      </div>
    </div>
  );
};

export default BiometricVisualizer;