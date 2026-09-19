import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveEvent } from '../../hooks/useLiveEvent';
import { eventApi } from '../../api/eventApi';
import { EventHealthCard } from '../../components/organizer/EventHealthCard';
import { AgendaManager } from '../../components/organizer/AgendaManager';
import { BroadcastModal } from '../../components/organizer/BroadcastModal';
import { ScriptGeneratorModal } from '../../components/ai/ScriptGeneratorModal';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { Radio, ExternalLink, Sparkles, MapPin, Calendar, Clock } from 'lucide-react';
import { formatTime } from '../../utils/timeUtils';

export const EventDashboard = () => {
  const { id } = useParams();
  const { event, sessions, loadEvent, loading } = useLiveEvent();

  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [selectedSessionForAI, setSelectedSessionForAI] = useState(null);

  useEffect(() => {
    if (id) {
      loadEvent(id);
    } else {
      // If no id in URL, load first event
      eventApi.getEvents().then((res) => {
        if (res.data && res.data.length > 0) {
          loadEvent(res.data[0]._id);
        }
      });
    }
  }, [id, loadEvent]);

  const handleSendBroadcast = async (alertData) => {
    if (!event) return;
    await eventApi.broadcastAlert(event._id, alertData);
  };

  if (loading && !event) {
    return <Loader text="Loading Organizer War-Room..." />;
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-white">No Event Selected</h2>
        <p className="text-xs text-slate-400 mt-2">Please select an event from the organizer list.</p>
        <Link to="/organizer" className="mt-4 inline-block">
          <Button variant="primary" size="sm">Go to Events</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Event Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-stage-900 via-stage-850 to-stage-900 border border-stage-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
              WAR-ROOM ACTIVE
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {event.venue || 'Main Stage'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {event.title}
          </h1>

          <p className="text-xs text-slate-400 mt-1">
            Theme: <span className="text-slate-200">{event.theme}</span>
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="danger"
            size="md"
            icon={Radio}
            onClick={() => setIsBroadcastModalOpen(true)}
          >
            Broadcast Alert
          </Button>

          <Link
            to={`/anchor/live/${event._id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="violet"
              size="md"
              icon={ExternalLink}
            >
              Open Anchor Screen
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid: Health & Telemetry on Top / Left */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Event Health Recharts metric */}
        <div className="lg:col-span-1 space-y-6">
          <EventHealthCard event={event} sessions={sessions} />

          {/* Quick instructions for organizer */}
          <div className="p-4 rounded-xl bg-stage-900/60 border border-stage-800 text-xs text-slate-400 space-y-2">
            <p className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">
              Live Control Quick Guide:
            </p>
            <p>• Click <span className="text-amber-400 font-semibold">+ Delay</span> on any session to push it forward. All following sessions cascade automatically.</p>
            <p>• Click <span className="text-rose-400 font-semibold">Go LIVE</span> to immediately switch the anchor's teleprompter to that speaker.</p>
            <p>• Click <span className="text-rose-400 font-semibold">Broadcast Alert</span> to flash an urgent red notice across the stage screen.</p>
          </div>
        </div>

        {/* Right column: Full Agenda Manager */}
        <div className="lg:col-span-2">
          <AgendaManager
            eventId={event._id}
            sessions={sessions}
            onReload={() => loadEvent(event._id)}
            onOpenAIModal={(s) => setSelectedSessionForAI(s)}
          />
        </div>
      </div>

      {/* Broadcast Flash Modal */}
      <BroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSubmit={handleSendBroadcast}
      />

      {/* AI Script Generator Modal */}
      <ScriptGeneratorModal
        isOpen={Boolean(selectedSessionForAI)}
        onClose={() => setSelectedSessionForAI(null)}
        eventId={event._id}
        session={selectedSessionForAI}
        onSuccess={() => loadEvent(event._id)}
      />
    </div>
  );
};
