import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventApi } from '../../api/eventApi';
import { exportRunOfShowPdf } from '../../utils/exportUtils';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Loader } from '../../components/common/Loader';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Calendar, Plus, MapPin, ArrowRight, ShieldCheck, FileDown, AlertCircle } from 'lucide-react';
import { getHealthBadgeConfig } from '../../utils/healthUtils';

export const EventsListPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('Main Convention Hall');
  const [theme, setTheme] = useState('AI & Future Systems');
  const [submitting, setSubmitting] = useState(false);

  // Stage 5 export state per card
  const [exportingId, setExportingId] = useState(null);
  const [exportErrorMap, setExportErrorMap] = useState({});

  const navigate = useNavigate();

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await eventApi.getEvents();
      setEvents(res.data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleExportEvent = async (eventId, eventTitle) => {
    if (exportingId) return;
    setExportingId(eventId);
    setExportErrorMap((prev) => ({ ...prev, [eventId]: null }));

    try {
      await exportRunOfShowPdf(eventId, eventTitle);
    } catch (err) {
      setExportErrorMap((prev) => ({
        ...prev,
        [eventId]: err.message || 'Failed to export PDF'
      }));
    } finally {
      setExportingId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const res = await eventApi.createEvent({
        title,
        venue,
        theme,
        date: new Date().toISOString()
      });
      setIsCreateModalOpen(false);
      navigate(`/organizer/events/${res.data._id}`);
    } catch (err) {
      console.error('Error creating event:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader text="Loading live events..." />;
  }

  return (
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-stage-950 via-stage-900 to-stage-950 border border-stage-800/90 shadow-2xl flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-live-dot" />
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
              LIVE EVENT MANAGEMENT NETWORK
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-300">
            Organizer Control Center
          </h1>

          <p className="text-xs text-slate-400 max-w-xl">
            Orchestrate multi-track live stage productions, real-time schedule delays, stage teleprompter feeds, and instant Run-of-Show PDF exports.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          icon={Plus}
          onClick={() => setIsCreateModalOpen(true)}
          className="shadow-xl shadow-cyan-500/25 relative z-10"
        >
          Create New Live Event
        </Button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((ev) => {
          const health = getHealthBadgeConfig(ev.healthStatus);
          const isExporting = exportingId === ev._id;
          const cardError = exportErrorMap[ev._id];

          return (
            <div
              key={ev._id}
              className="glass-panel-interactive rounded-3xl p-6 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${health.bg}`}>
                    {health.label}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {new Date(ev.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-white tracking-tight leading-snug">
                  {ev.title}
                </h3>

                <div className="space-y-1 text-xs text-slate-400">
                  <p className="flex items-center gap-1.5 font-medium text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    {ev.venue || 'Main Stage'}
                  </p>

                  <p className="font-medium text-slate-400">
                    Theme: <span className="text-slate-200">{ev.theme || 'Tech'}</span>
                  </p>
                </div>

                {ev.totalDelayMinutes > 0 && (
                  <div className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Schedule Drift: +{ev.totalDelayMinutes} minutes
                  </div>
                )}

                {cardError && (
                  <div className="text-xs text-rose-300 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/30 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{cardError}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-stage-800/80 flex flex-wrap items-center justify-between gap-3">
                <Link
                  to={`/organizer/events/${ev._id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Enter War-Room <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={FileDown}
                    loading={isExporting}
                    disabled={isExporting}
                    onClick={() => handleExportEvent(ev._id, ev.title)}
                    className="text-xs border-cyan-500/30 text-cyan-300 hover:border-cyan-400"
                    title="Export Run-of-Show PDF"
                  >
                    Export PDF
                  </Button>

                  <Link
                    to={`/anchor/live/${ev._id}`}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 px-2 py-1 rounded-lg hover:bg-stage-800/80 transition-colors"
                  >
                    Anchor View
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Live Event"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Event Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. AI Horizons Summit 2026"
            required
          />

          <Input
            label="Venue / Stage Name"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. Grand Auditorium – Hall A"
            required
          />

          <Input
            label="Theme / Topic"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g. Autonomous Agents & Spatial Robotics"
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-stage-800">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Create Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
