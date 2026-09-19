import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventApi } from '../../api/eventApi';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Loader } from '../../components/common/Loader';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Calendar, Plus, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';
import { getHealthBadgeConfig } from '../../utils/healthUtils';

export const EventsListPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('Main Convention Hall');
  const [theme, setTheme] = useState('AI & Future Systems');
  const [submitting, setSubmitting] = useState(false);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-stage-850">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Organizer Control Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your live conferences, agenda schedules, delays, and stage broadcasts
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create New Event
        </Button>
      </div>

      {/* Events Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((ev) => {
          const health = getHealthBadgeConfig(ev.healthStatus);

          return (
            <Card
              key={ev._id}
              hoverEffect
              className="flex flex-col justify-between border-stage-800 bg-stage-900/90"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${health.bg}`}>
                    {health.label}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {new Date(ev.date).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white tracking-tight leading-snug mb-2">
                  {ev.title}
                </h3>

                <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {ev.venue || 'Main Stage'}
                </p>

                <p className="text-xs text-slate-400 font-medium">
                  Theme: <span className="text-slate-200">{ev.theme || 'Tech'}</span>
                </p>

                {ev.totalDelayMinutes > 0 && (
                  <div className="mt-3 text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                    Schedule Drift: +{ev.totalDelayMinutes} minutes
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-stage-800/80 flex items-center justify-between">
                <Link
                  to={`/organizer/events/${ev._id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Enter War-Room <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to={`/anchor/live/${ev._id}`}
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300"
                >
                  Anchor View
                </Link>
              </div>
            </Card>
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
