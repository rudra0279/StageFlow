import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  ThumbsUp,
  CheckCircle,
  AlertCircle,
  Send,
  Radio,
  Calendar,
  ChevronDown,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { questionApi } from '../api/questionApi';
import { eventApi } from '../api/eventApi';
import { SocketContext } from '../context/SocketContext';

export const AudienceQAView = () => {
  const { id: urlEventId } = useParams();
  const { socket } = useContext(SocketContext);

  // Event State
  const [eventId, setEventId] = useState(urlEventId || null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventsList, setEventsList] = useState([]);
  const [loadingEvent, setLoadingEvent] = useState(true);

  // Form State
  const [question, setQuestion] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [availableTracks, setAvailableTracks] = useState(['Track A', 'Track B', 'Track C']);
  const [track, setTrack] = useState('Track A');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Feed State
  const [approvedQuestions, setApprovedQuestions] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [upvotedIds, setUpvotedIds] = useState(new Set());
  const [voterId] = useState(() => {
    const saved = localStorage.getItem('stagepilot_voter_id');
    if (saved) return saved;
    const newId = 'voter_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('stagepilot_voter_id', newId);
    return newId;
  });

  // 1. Resolve Active Event dynamically
  const resolveEvents = useCallback(async () => {
    try {
      setLoadingEvent(true);
      const res = await eventApi.getEvents();
      const events = Array.isArray(res?.data) ? res.data : [];
      setEventsList(events);

      if (events.length > 0) {
        let matched = null;

        // 1. Match from URL param
        if (urlEventId) {
          matched = events.find((e) => e._id === urlEventId);
        }

        // 2. Match from saved localStorage if not in URL
        if (!matched) {
          const savedId = localStorage.getItem('selectedEventId');
          if (savedId) {
            matched = events.find((e) => e._id === savedId);
          }
        }

        // 3. Fallback: Prioritize LIVE, then UPCOMING, else first event
        if (!matched) {
          matched =
            events.find((e) => e.status === 'LIVE') ||
            events.find((e) => e.status === 'UPCOMING') ||
            events[0];
        }

        if (matched) {
          setEventId(matched._id);
          setCurrentEvent(matched);
          localStorage.setItem('selectedEventId', matched._id);

          // Extract tracks if event has custom tracks
          if (Array.isArray(matched.tracks) && matched.tracks.length > 0) {
            const trackNames = matched.tracks.map((t) => (typeof t === 'string' ? t : t.name || 'Track'));
            setAvailableTracks(trackNames);
            if (!trackNames.includes(track)) {
              setTrack(trackNames[0]);
            }
          }
        }
      } else if (urlEventId) {
        setEventId(urlEventId);
      }
    } catch (err) {
      console.error('Failed to load events for Q&A:', err);
      if (urlEventId) setEventId(urlEventId);
    } finally {
      setLoadingEvent(false);
    }
  }, [urlEventId]);

  useEffect(() => {
    resolveEvents();
  }, [resolveEvents]);

  // 2. Load approved questions for selected event & track
  const fetchQuestions = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoadingFeed(true);
      const res = await questionApi.getAnchorFeed(eventId, track);
      if (res?.success && Array.isArray(res.data)) {
        setApprovedQuestions(res.data);
      }
    } catch (err) {
      console.error('Failed to load approved questions:', err);
    } finally {
      setLoadingFeed(false);
    }
  }, [eventId, track]);

  useEffect(() => {
    if (eventId) {
      fetchQuestions();
    }
  }, [eventId, track, fetchQuestions]);

  // 3. Socket.IO real-time audience synchronization
  useEffect(() => {
    if (!socket || !eventId) return;

    // Join audience room with current track
    socket.emit('joinEvent', { eventId, role: 'AUDIENCE', track });
    socket.emit('joinTrack', { eventId, track });

    const isTrackMatch = (questionTrack) => {
      if (!track || !questionTrack) return true;
      const normCur = track.toLowerCase().replace(/[\s_]/g, '');
      const normQ = String(questionTrack).toLowerCase().replace(/[\s_]/g, '');
      return normCur === normQ || questionTrack === track;
    };

    const handleApproved = (payload) => {
      const q = payload?.question || payload;
      if (!q || !q._id) return;
      const qTrack = q.track || q.trackId || payload?.track || payload?.trackId;

      if (isTrackMatch(qTrack)) {
        setApprovedQuestions((prev) => [
          q,
          ...prev.filter((item) => item._id !== q._id)
        ]);
      }
    };

    const handleUpvoted = (payload) => {
      if (!payload?.questionId) return;
      setApprovedQuestions((prev) =>
        prev.map((q) =>
          q._id === payload.questionId ? { ...q, upvotes: payload.upvotes } : q
        )
      );
    };

    const handleAnswered = (payload) => {
      if (!payload?.questionId) return;
      setApprovedQuestions((prev) =>
        prev.map((q) =>
          q._id === payload.questionId
            ? { ...q, status: 'ANSWERED', isAnswered: true }
            : q
        )
      );
    };

    socket.on('questionApproved', handleApproved);
    socket.on('question_approved', handleApproved);
    socket.on('questionUpvoted', handleUpvoted);
    socket.on('question_upvoted', handleUpvoted);
    socket.on('questionAnswered', handleAnswered);
    socket.on('question_answered', handleAnswered);

    return () => {
      socket.off('questionApproved', handleApproved);
      socket.off('question_approved', handleApproved);
      socket.off('questionUpvoted', handleUpvoted);
      socket.off('question_upvoted', handleUpvoted);
      socket.off('questionAnswered', handleAnswered);
      socket.off('question_answered', handleAnswered);
    };
  }, [socket, eventId, track]);

  // Handle Event Switching
  const handleSelectEvent = (newId) => {
    const selected = eventsList.find((e) => e._id === newId);
    if (selected) {
      setEventId(selected._id);
      setCurrentEvent(selected);
      localStorage.setItem('selectedEventId', selected._id);
      setErrorMessage('');
      setSuccessMessage('');
      if (Array.isArray(selected.tracks) && selected.tracks.length > 0) {
        const trackNames = selected.tracks.map((t) => (typeof t === 'string' ? t : t.name || 'Track'));
        setAvailableTracks(trackNames);
        setTrack(trackNames[0]);
      }
    }
  };

  // Handle Track Switching
  const handleSelectTrack = (t) => {
    setTrack(t);
    setErrorMessage('');
    setSuccessMessage('');
    if (socket && eventId) {
      socket.emit('joinTrack', { eventId, track: t });
    }
  };

  // 4. Submit Question
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!eventId) {
      setErrorMessage('No event connected. Please select an event before submitting.');
      return;
    }

    const cleanQuestion = question.trim();
    if (!cleanQuestion || cleanQuestion.length < 3) {
      setErrorMessage('Question must be at least 3 characters long.');
      return;
    }
    if (cleanQuestion.length > 500) {
      setErrorMessage('Question cannot exceed 500 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await questionApi.submitQuestion(eventId, {
        question: cleanQuestion,
        authorName: authorName.trim() || 'Anonymous',
        track,
        voterId
      });

      if (res?.success) {
        setSuccessMessage(`Your question for ${track} has been submitted and is awaiting organizer approval!`);
        setQuestion('');
        setTimeout(() => setSuccessMessage(''), 6000);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to submit question. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Upvote Question
  const handleUpvote = async (qId) => {
    if (upvotedIds.has(qId) || !eventId) return;

    try {
      // Optimistic local update
      setUpvotedIds((prev) => new Set(prev).add(qId));
      setApprovedQuestions((prev) =>
        prev.map((q) => (q._id === qId ? { ...q, upvotes: (q.upvotes || 0) + 1 } : q))
      );

      const res = await questionApi.upvoteQuestion(eventId, qId, voterId);
      if (res?.success && res.data?.upvotes !== undefined) {
        setApprovedQuestions((prev) =>
          prev.map((q) => (q._id === qId ? { ...q, upvotes: res.data.upvotes } : q))
        );
      }
    } catch (err) {
      console.error('Upvote failed:', err);
      // Revert if rejected
      if (err.response?.data?.message?.includes('already upvoted')) {
        // Keep as upvoted
      } else {
        setUpvotedIds((prev) => {
          const next = new Set(prev);
          next.delete(qId);
          return next;
        });
        fetchQuestions();
      }
    }
  };

  // Loading Screen while resolving active event
  if (loadingEvent && !eventId) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
          <Radio className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-lg font-bold text-white">Connecting to Live Stage Q&A...</h2>
        <p className="text-xs text-slate-400">Discovering active event and stage tracks...</p>
      </div>
    );
  }

  // Empty State if no events exist
  if (!loadingEvent && !eventId && eventsList.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">No Active Events Found</h2>
        <p className="text-xs text-slate-400">
          There are currently no live or upcoming events scheduled. Please check back later or start an event in the dashboard.
        </p>
        <button
          type="button"
          onClick={resolveEvents}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stage-800 hover:bg-stage-700 text-xs font-semibold text-white border border-stage-700 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Live Stage Audience Q&A</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Ask the Stage Speakers</h1>
        <p className="text-xs text-slate-400">
          Submit your questions live for the stage anchors and keynote speakers.
        </p>

        {/* Active Event Indicator / Event Selector */}
        {currentEvent && (
          <div className="pt-1">
            {eventsList.length > 1 ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stage-900 border border-stage-800 text-slate-300 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <select
                  value={eventId || ''}
                  onChange={(e) => handleSelectEvent(e.target.value)}
                  className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer pr-1"
                >
                  {eventsList.map((e) => (
                    <option key={e._id} value={e._id} className="bg-stage-950 text-white">
                      {e.title || e.name || 'Unnamed Event'} {e.status === 'LIVE' ? '● LIVE' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stage-900/80 border border-stage-800 text-slate-300 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-white truncate max-w-[240px]">
                  {currentEvent.title || currentEvent.name}
                </span>
                {currentEvent.venue && (
                  <span className="text-slate-500 text-[11px] truncate">· {currentEvent.venue}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Track Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            Select Stage Track
          </span>
          <span className="text-cyan-400 font-semibold">{track} Active</span>
        </div>
        <div className="flex bg-stage-900 p-1 rounded-xl border border-stage-800 gap-1">
          {availableTracks.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleSelectTrack(t)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                track === t
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-stage-800/50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Submission Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-stage-900/90 border border-stage-800 rounded-2xl p-5 space-y-4 shadow-xl"
      >
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex justify-between">
            <span>Your Question ({track}) *</span>
            <span className={question.length > 450 ? 'text-amber-400' : 'text-slate-500'}>
              {question.length}/500
            </span>
          </label>
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`Ask a question for ${track} speakers...`}
            maxLength={500}
            className="w-full bg-stage-950 border border-stage-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Your Name (Optional)</label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Anonymous attendee"
            maxLength={50}
            className="w-full bg-stage-950 border border-stage-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !question.trim()}
          className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
        >
          {submitting ? (
            <span className="animate-spin border-2 border-slate-950 border-t-transparent rounded-full w-4 h-4" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit to {track}</span>
            </>
          )}
        </button>
      </form>

      {/* Live Approved Questions Feed */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Approved Audience Feed ({track})</span>
          <span className="text-cyan-400">{approvedQuestions.length} questions</span>
        </h3>

        {loadingFeed ? (
          <div className="text-center py-8 text-slate-400 text-xs flex items-center justify-center gap-2">
            <span className="animate-spin border-2 border-cyan-400 border-t-transparent rounded-full w-4 h-4" />
            <span>Updating {track} feed...</span>
          </div>
        ) : approvedQuestions.length === 0 ? (
          <div className="text-center py-8 bg-stage-900/40 border border-stage-800/60 rounded-xl p-4 text-slate-500 text-xs">
            No approved questions on {track} yet. Be the first to ask!
          </div>
        ) : (
          approvedQuestions.map((q) => {
            const isAnswered = q.status === 'ANSWERED' || q.isAnswered;
            const hasUpvoted = upvotedIds.has(q._id);

            return (
              <div
                key={q._id}
                className={`p-4 rounded-xl border transition-all ${
                  isAnswered
                    ? 'bg-stage-900/40 border-stage-800/40 opacity-75'
                    : 'bg-stage-900 border-stage-800 hover:border-stage-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-white leading-relaxed">
                      {q.question || q.text}
                    </p>
                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                      <span>by {q.authorName || 'Anonymous'}</span>
                      <span className="px-2 py-0.5 rounded bg-stage-800 border border-stage-700 text-cyan-300 text-[10px] font-mono font-bold uppercase">
                        {q.track || q.trackId || track}
                      </span>
                      {isAnswered && (
                        <span className="text-emerald-400 font-semibold text-[10px] uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Answered
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpvote(q._id)}
                    disabled={hasUpvoted || isAnswered}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shrink-0 ${
                      hasUpvoted
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-stage-800 border-stage-700 text-slate-300 hover:border-cyan-500/50 hover:text-white cursor-pointer'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{q.upvotes || 0}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
