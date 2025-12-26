import React, { useEffect, useState } from 'react';
import { MockBackend } from '../services/mockBackend';
import { SecurityLog, BiometricMetrics } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface DashboardProps {
  isDarkMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ isDarkMode }) => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [stats, setStats] = useState({ attempts: 0, blocks: 0, attacks: 0 });
  const [metrics, setMetrics] = useState<BiometricMetrics>(MockBackend.getMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      const currentLogs = MockBackend.getLogs();
      setLogs(currentLogs);
      setMetrics(MockBackend.getMetrics());

      const attempts = currentLogs.filter(l => l.eventType.includes('AUTH')).length;
      const blocks = currentLogs.filter(l => l.eventType === 'AUTH_FAILURE').length;
      const attacks = currentLogs.filter(l => l.eventType === 'ATTACK_DETECTED' || l.eventType === 'SYSTEM_ALERT' || l.eventType === 'BIOMETRIC_IMPERSONATION_LOCKOUT').length;

      setStats({ attempts, blocks, attacks });
    }, 1000);
    return () => clearInterval(interval);
  }, []);



  const chartData = [
    { name: 'Total Auth', value: stats.attempts },
    { name: 'Failures', value: stats.blocks },
    { name: 'Threats', value: stats.attacks },
  ];

  const axisColor = isDarkMode ? '#52525b' : '#9ca3af';

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-zinc-500 text-sm font-medium">Total Authentications (Last Hour)</h3>
          <p className="text-3xl font-bold dark:text-white text-gray-900 mt-2">{stats.attempts}</p>
        </div>
        <div className="dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-zinc-500 text-sm font-medium">Access Denied</h3>
          <p className="text-3xl font-bold text-yellow-500 mt-2">{stats.blocks}</p>
        </div>
        <div className="dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-zinc-500 text-sm font-medium">Active Threats Detected</h3>
          <p className="text-3xl font-bold text-red-500 mt-2">{stats.attacks}</p>
        </div>
      </div>

      {/* Biometric Calibration Section REMOVED */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-gray-200 p-6 rounded-lg h-[300px] shadow-sm">
          <h3 className="text-zinc-400 text-sm mb-4">Security Metrics</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: isDarkMode ? '#18181b' : '#ffffff', border: isDarkMode ? '1px solid #3f3f46' : '1px solid #e5e7eb', color: isDarkMode ? '#e4e4e7' : '#111827' }}
                itemStyle={{ color: isDarkMode ? '#e4e4e7' : '#111827' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#eab308' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Logs Table */}
        <div className="dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-gray-200 p-6 rounded-lg h-[300px] overflow-hidden flex flex-col shadow-sm">
          <h3 className="text-zinc-400 text-sm mb-4">Live Security Stream</h3>
          <div className="overflow-y-auto flex-1 space-y-2 pr-2">
            {logs.map((log) => (
              <div key={log.id} className="text-xs border-b dark:border-zinc-800/50 border-gray-100 pb-2 mb-2 last:border-0">
                <div className="flex justify-between text-zinc-500 mb-1">
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className={`
                    ${log.eventType === 'CONFIG_CHANGE' ? 'text-blue-500' : ''}
                    ${log.severity === 'CRITICAL' ? 'text-red-600' : log.severity === 'WARNING' ? 'text-yellow-600' : 'text-emerald-600'}
                  `}>
                    {log.eventType}
                  </span>
                </div>
                <div className="dark:text-zinc-300 text-gray-700 font-mono truncate">{log.details}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;