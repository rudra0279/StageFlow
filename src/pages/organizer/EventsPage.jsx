import React, { useState } from 'react';
import { useEvent } from '../../hooks/useEvent';
import EventCard from '../../components/organizer/EventCard';
import { Calendar, Plus, Search, Filter } from 'lucide-react';

export const EventsPage = () => {
  const { events, selectEvent, setActiveEvent } = useEvent();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '',
    subtitle: '',
    location: '',
    date: '2026-09-25',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
  });

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    const created = {
      id: `evt_${Date.now()}`,
      ...newEvent,
      status: 'UPCOMING',
      totalAttendees: 500,
      timeDriftMinutes: 0,
    };

    setActiveEvent((prev) => [created, ...prev]);
    setIsModalOpen(false);
    setNewEvent({
      title: '',
      subtitle: '',
      location: '',
      date: '2026-09-25',
      startTime: '09:00 AM',
      endTime: '05:00 PM',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100">Event Catalog & Schedule</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage live broadcast events and stage telemetry</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 p-3 glass-panel rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search events by name or stage venue..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Event Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((evt) => (
          <EventCard key={evt.id} event={evt} onSelect={selectEvent} />
        ))}
      </div>

      {/* New Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-lg w-full border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-100">Create New Stage Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g. AI Hackathon Final Demos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Subtitle / Theme
                </label>
                <input
                  type="text"
                  value={newEvent.subtitle}
                  onChange={(e) => setNewEvent({ ...newEvent, subtitle: e.target.value })}
                  placeholder="e.g. Realtime Intelligent Co-Pilots"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Stage / Location Venue
                </label>
                <input
                  type="text"
                  required
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="e.g. Main Auditorium Stage A"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
