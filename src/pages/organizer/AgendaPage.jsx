import React, { useState } from 'react';
import { useAgenda } from '../../hooks/useAgenda';
import { useEvent } from '../../hooks/useEvent';
import AgendaTimeline from '../../components/organizer/AgendaTimeline';
import { Clock, Plus, Sliders, ArrowUp, ArrowDown } from 'lucide-react';

export const AgendaPage = () => {
  const { agenda, jumpToSegment, setAgenda } = useAgenda();
  const { timeDrift, updateDrift } = useEvent();
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDuration, setNewItemDuration] = useState(20);
  const [speakerName, setSpeakerName] = useState('');

  const handleAddSegment = (e) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const newItem = {
      id: `agenda_${Date.now()}`,
      eventId: 'evt_001',
      title: newItemTitle,
      description: 'Added via StagePilot Agenda Manager.',
      speakerId: 'spk_new',
      speakerName: speakerName || 'Guest Speaker',
      startTime: '11:00 AM',
      allocatedMinutes: Number(newItemDuration),
      status: 'UPCOMING',
      order: agenda.length + 1,
      teleprompterScript: `Please welcome ${speakerName || 'our guest speaker'} to discuss ${newItemTitle}.`,
    };

    setAgenda((prev) => [...prev, newItem]);
    setNewItemTitle('');
    setSpeakerName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100">Agenda Timeline & Buffer Control</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage stage segment durations, sequence order, and drift offsets
          </p>
        </div>

        {/* Global Drift Offset Adjuster */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs font-bold text-slate-400 px-2 uppercase font-mono">
            GLOBAL DRIFT: <strong className="text-amber-400">+{timeDrift} MIN</strong>
          </span>
          <button
            onClick={() => updateDrift(-1)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded"
            title="Reduce Schedule Drift (-1m)"
          >
            -1m
          </button>
          <button
            onClick={() => updateDrift(1)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded"
            title="Increase Schedule Drift (+1m)"
          >
            +1m
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols wide): Agenda Timeline */}
        <div className="lg:col-span-2">
          <AgendaTimeline agenda={agenda} onJumpSegment={jumpToSegment} />
        </div>

        {/* Right Column: Add Segment Panel */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Add Segment to Sequence</span>
            </h3>

            <form onSubmit={handleAddSegment} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Segment Title
                </label>
                <input
                  type="text"
                  required
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="e.g. Q&A Session / Sponsor Break"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Speaker Name
                </label>
                <input
                  type="text"
                  value={speakerName}
                  onChange={(e) => setSpeakerName(e.target.value)}
                  placeholder="e.g. Marcus Vance"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Allocated Duration (Minutes)
                </label>
                <input
                  type="number"
                  required
                  min={5}
                  max={120}
                  value={newItemDuration}
                  onChange={(e) => setNewItemDuration(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20"
              >
                Insert Agenda Segment
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgendaPage;
