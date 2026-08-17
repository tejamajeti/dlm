import React, { useEffect, useState } from 'react';
import { AuditLog } from '../types';
import api from '../services/api';
import { ScrollText, Radio, Shield } from 'lucide-react';
import { SEO } from '../components/SEO';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res: any = await api.get('/protected/analytics/dashboard');
        if (res.success && res.data?.recentAuditLogs) {
          setLogs(res.data.recentAuditLogs);
        }
      } catch (e) {}
    }
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <SEO
        title="Live Audit Trail - DLM Platform"
        description="Immutable system activity log recording operational events and state mutations."
      />
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Live System Audit Trail</h2>
        <p className="text-xs text-slate-400 mt-1">Immutable system activity log recording operational events and state mutations</p>
      </div>

      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-slate-400 uppercase bg-slate-900/80 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Event Action</th>
                <th className="px-4 py-3">Actor ID</th>
                <th className="px-4 py-3">Entity Type</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Payload Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 font-bold text-cyan-400">{log.action}</td>
                  <td className="px-4 py-3 text-slate-200">{log.actor_id}</td>
                  <td className="px-4 py-3 text-indigo-400">{log.entity}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-[11px] text-slate-400 truncate max-w-xs">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
