import React, { useEffect, useState } from 'react';
import { SecurityLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Activity, Shield, Users, Lock, AlertTriangle, CheckCircle, XCircle, Zap } from 'lucide-react';
import { BackendAPI } from '../services/api';

const Dashboard: React.FC = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [stats, setStats] = useState({
    total_auths_1h: 0,
    access_denied_24h: 0,
    active_threats: 0,
    threats_detected_24h: 0
  });

  const fetchMetrics = async () => {
    try {
      const data = await BackendAPI.getMetrics();
      setStats(data);
    } catch (e) {
      console.error("Failed to load dashboard metrics", e);
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await BackendAPI.getLogs();
      setLogs(data);
    } catch (e) {
      console.error("Failed to fetch logs", e);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchLogs();
    const metricsInterval = setInterval(fetchMetrics, 5000);
    const logsInterval = setInterval(fetchLogs, 2000);

    return () => {
      clearInterval(metricsInterval);
      clearInterval(logsInterval);
    };
  }, []);

  const chartData = [
    { name: 'Total Auth', value: stats.total_auths_1h },
    { name: 'Failures', value: stats.access_denied_24h },
    { name: 'Threats', value: stats.active_threats + stats.threats_detected_24h },
  ];

  const axisColor = '#9ca3af';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-gray-200 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total Auths (1h)</p>
              <h3 className="text-2xl font-bold dark:text-white text-gray-900 mt-1">{stats.total_auths_1h}</h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Activity className="text-blue-500" size={20} />
            </div>
          </div>
        </div>

        <div className="dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-gray-200 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Access Denied (24h)</p>
              <h3 className="text-2xl font-bold dark:text-white text-gray-900 mt-1">{stats.access_denied_24h}</h3>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle className="text-red-500" size={20} />
            </div>
          </div>
        </div>

        <div className="dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-gray-200 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Active Threats</p>
              <h3 className="text-2xl font-bold dark:text-white text-gray-900 mt-1">{stats.active_threats}</h3>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <AlertTriangle className="text-yellow-500" size={20} />
            </div>
          </div>
        </div>

        <div className="dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-gray-200 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Threats Detected</p>
              <h3 className="text-2xl font-bold dark:text-white text-gray-900 mt-1">{stats.threats_detected_24h}</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Shield className="text-emerald-500" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-gray-200 p-6 rounded-lg h-[300px] shadow-sm">
          <h3 className="text-zinc-400 text-sm mb-4">Security Metrics</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', color: '#111827' }}
                itemStyle={{ color: '#111827' }}
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