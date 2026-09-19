import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { getHealthBadgeConfig } from '../../utils/healthUtils';
import { Clock, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

export const EventHealthCard = ({ event, sessions = [] }) => {
  const healthConfig = getHealthBadgeConfig(event?.healthStatus);
  const totalDelay = event?.totalDelayMinutes || 0;

  // Chart data: session scheduled duration vs actual duration with delays
  const chartData = sessions.map((s, idx) => ({
    name: `#${idx + 1}`,
    title: s.title.slice(0, 15) + '...',
    duration: s.durationMinutes,
    delay: s.delayOffsetMinutes || 0
  }));

  return (
    <Card className="bg-stage-900/80 backdrop-blur border-stage-800">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">Event Health & Drift</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Real-time schedule variance & timeline telemetry</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Cumulative Drift
            </span>
            <span
              className={`text-lg font-black font-mono ${
                totalDelay === 0
                  ? 'text-emerald-400'
                  : totalDelay <= 15
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {totalDelay > 0 ? `+${totalDelay}m` : '0m'}
            </span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${healthConfig.bg}`}
          >
            <span className={`w-2 h-2 rounded-full ${healthConfig.dot}`} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {healthConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Mini Metric Grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="p-3 rounded-lg bg-stage-950 border border-stage-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Sessions</p>
          <p className="text-xl font-bold text-white font-mono mt-1">{sessions.length}</p>
        </div>
        <div className="p-3 rounded-lg bg-stage-950 border border-stage-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Live / Completed</p>
          <p className="text-xl font-bold text-cyan-400 font-mono mt-1">
            {sessions.filter((s) => s.status === 'LIVE' || s.status === 'COMPLETED').length} / {sessions.length}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-stage-950 border border-stage-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Health Score</p>
          <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
            {totalDelay === 0 ? '100%' : totalDelay <= 10 ? '88%' : '62%'}
          </p>
        </div>
      </div>

      {/* Recharts Timeline Bar */}
      <div className="h-32 w-full pt-2">
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
          Session Duration & Delay Distribution (minutes)
        </p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0d1a',
                borderColor: '#222b4c',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="duration" name="Scheduled (min)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            <Bar dataKey="delay" name="Delay Added (min)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
