import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveEvent } from '../../hooks/useLiveEvent';
import { useAuth } from '../../hooks/useAuth';
import { SocketContext } from '../../context/SocketContext';
import { eventApi } from '../../api/eventApi';
import { exportRunOfShowPdf } from '../../utils/exportUtils';
import { EventHealthCard } from '../../components/organizer/EventHealthCard';
import { AgendaManager } from '../../components/organizer/AgendaManager';
import { BroadcastModal } from '../../components/organizer/BroadcastModal';
import { ScriptGeneratorModal } from '../../components/ai/ScriptGeneratorModal';
import { OrganizerQAModeration } from '../../components/organizer/OrganizerQAModeration';
import { CommitteeDirectory } from '../../components/organizer/CommitteeDirectory';
import { TaskBoard } from '../../components/organizer/TaskBoard';
import { EventCommandChat } from '../../components/organizer/EventCommandChat';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import {
  Radio,
  ExternalLink,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  FileDown,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  Users,
  HelpCircle,
  ShieldCheck,
  Zap,
  Sliders
} from 'lucide-react';
import { formatTime } from '../../utils/timeUtils';

export const EventDashboard = () => {
  const { id } = useParams();
  const { event, sessions, loadEvent, loading } = useLiveEvent();
  const { user } = useAuth();
  const { socket, joinEvent } = useContext(SocketContext) || {};

  // Active Command Center Navigation Tab
  const [activeTab, setActiveTab] = useState('war-room'); // 'war-room', 'tasks', 'chat', 'committee', 'qa'
  const [prefillRecipient, setPrefillRecipient] = useState(null);

  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [selectedSessionForAI, setSelectedSessionForAI] = useState(null);

  // Stage 5 Export States
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(false);

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

  // Join Socket.IO Event Room on event load
  useEffect(() => {
    if (event?._id && joinEvent) {
      joinEvent(event._id);
    }
  }, [event?._id, joinEvent]);

  const handleSendBroadcast = async (alertData) => {
    if (!event) return;
    await eventApi.broadcastAlert(event._id, alertData);
  };

  const handleExportPdf = async () => {
    if (!event || exporting) return;
    setExporting(true);
    setExportError(null);
    setExportSuccess(false);

    try {
      await exportRunOfShowPdf(event._id, event.title || event.name);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 6000);
    } catch (err) {
      setExportError(err.message || 'Failed to export Run-of-Show PDF.');
    } finally {
      setExporting(false);
    }
  };

  if (loading && !event) {
    return <Loader text="Loading Organizer Command Center..." />;
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
      {/* 20. LIVE EVENT COMMAND CENTER HERO BANNER */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-stage-950 via-stage-900 to-stage-950 border border-stage-800/90 shadow-2xl space-y-6">
        {/* Subtle Ambient Glowing Background Orbs */}
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-float-slow" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2">
            {/* Live Command Center Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full uppercase shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-live-dot" />
                LIVE EVENT COMMAND CENTER
              </span>

              {event.totalDelayMinutes > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full uppercase">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  +{event.totalDelayMinutes} MIN DELAY
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full uppercase">
                  ● ON SCHEDULE
                </span>
              )}
            </div>

            {/* Event Main Title */}
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-300">
              {event.title}
            </h1>

            {/* Event Subtitle & Metadata */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {event.venue || 'Main Stage'}
              </span>
              <span className="text-slate-700">•</span>
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-slate-700">•</span>
              <span className="text-slate-400">
                Theme: <span className="text-slate-200 font-semibold">{event.theme}</span>
              </span>
            </div>
          </div>

          {/* Global Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              icon={FileDown}
              loading={exporting}
              disabled={exporting}
              onClick={handleExportPdf}
              className="glass-panel-interactive border-cyan-500/40 hover:border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/10"
            >
              {exporting ? 'Exporting PDF...' : 'Export Run-of-Show PDF'}
            </Button>

            <Button
              variant="danger"
              size="md"
              icon={Radio}
              onClick={() => setIsBroadcastModalOpen(true)}
              className="shadow-lg shadow-rose-600/30"
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
                className="shadow-lg shadow-indigo-500/20"
              >
                Open Anchor Screen
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Export Notifications */}
      {exportSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 text-emerald-300 text-xs shadow-lg animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span><strong>Run-of-Show PDF Exported:</strong> Complete multi-track schedule downloaded successfully.</span>
          </div>
          <button onClick={() => setExportSuccess(false)} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {exportError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4 text-rose-300 text-xs shadow-lg animate-fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span><strong>Export Error:</strong> {exportError}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="danger" size="sm" icon={RefreshCw} onClick={handleExportPdf}>
              Retry Export
            </Button>
            <button onClick={() => setExportError(null)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Command Center Modular Navigation Tabs */}
      <div className="p-1.5 rounded-2xl bg-stage-900 border border-stage-800 flex flex-wrap items-center gap-1.5">
        {[
          { id: 'war-room', label: 'Live War Room', icon: LayoutDashboard },
          { id: 'tasks', label: 'Task Board & Areas', icon: ListTodo },
          { id: 'chat', label: 'Event Command Chat', icon: MessageSquare },
          { id: 'committee', label: 'Organizer Committee', icon: Users },
          { id: 'qa', label: 'Audience Q&A Queue', icon: HelpCircle }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-md shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-stage-800/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: LIVE WAR ROOM & AGENDA                             */}
      {/* ========================================================= */}
      {activeTab === 'war-room' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
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
          <div className="lg:col-span-2 space-y-6">
            <AgendaManager
              eventId={event._id}
              sessions={sessions}
              onReload={() => loadEvent(event._id)}
              onOpenAIModal={(s) => setSelectedSessionForAI(s)}
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ROLE-BASED TASK BOARD & WORK AREAS                 */}
      {/* ========================================================= */}
      {activeTab === 'tasks' && (
        <div className="animate-fade-in">
          <TaskBoard
            eventId={event._id}
            event={event}
            currentUser={user}
            socket={socket}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: EVENT COMMAND CHAT                                 */}
      {/* ========================================================= */}
      {activeTab === 'chat' && (
        <div className="max-w-4xl mx-auto animate-fade-in">
          <EventCommandChat
            eventId={event._id}
            currentUser={user}
            socket={socket}
            prefillRecipient={prefillRecipient}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ORGANIZER COMMITTEE DIRECTORY                      */}
      {/* ========================================================= */}
      {activeTab === 'committee' && (
        <div className="animate-fade-in">
          <CommitteeDirectory
            eventId={event._id}
            currentUser={user}
            onSelectMemberForChat={(member) => {
              setPrefillRecipient(member);
              setActiveTab('chat');
            }}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: AUDIENCE Q&A QUEUE                                 */}
      {/* ========================================================= */}
      {activeTab === 'qa' && (
        <div className="animate-fade-in">
          <OrganizerQAModeration eventId={event._id} />
        </div>
      )}

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
