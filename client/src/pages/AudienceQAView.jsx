import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquarePlus, ThumbsUp, CheckCircle, AlertCircle, Sparkles, Send, Radio } from 'lucide-react';
import { questionApi } from '../api/questionApi';
import { SocketContext } from '../context/SocketContext';

export const AudienceQAView = () => {
  const { id: urlEventId } = useParams();
  const eventId = urlEventId || '650000000000000000000001';
  const { socket } = useContext(SocketContext);

  const [question, setQuestion] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [track, setTrack] = useState('Track A');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [approvedQuestions, setApprovedQuestions] = useState([]);
  const [upvotedIds, setUpvotedIds] = useState(new Set());
  const [voterId] = useState(() => 'voter_' + Math.random().toString(36).substring(2, 9));

  // Load approved questions
  const fetchQuestions = async () => {
    try {
      const res = await questionApi.getAnchorFeed(eventId, track);
      if (res.success && res.data) {
        setApprovedQuestions(res.data);
      }
    } catch (err) {
      console.error('Failed to load approved questions:', err);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [eventId, track]);

  // Listen to Socket.IO upvote and answer events
  useEffect(() => {
    if (!socket) return;

    socket.emit('joinEvent', { eventId, role: 'AUDIENCE' });

    const handleApproved = (payload) => {
      if (payload.question && (!track || payload.question.track === track || payload.question.trackId === track)) {
        setApprovedQuestions((prev) => [payload.question, ...prev.filter(q => q._id !== payload.question._id)]);
      }
    };

    const handleUpvoted = (payload) => {
      setApprovedQuestions((prev) =>
        prev.map((q) => (q._id === payload.questionId ? { ...q, upvotes: payload.upvotes } : q))
      );
    };

    const handleAnswered = (payload) => {
      setApprovedQuestions((prev) =>
        prev.map((q) => (q._id === payload.questionId ? { ...q, status: 'ANSWERED', isAnswered: true } : q))
      );
    };

    socket.on('questionApproved', handleApproved);
    socket.on('questionUpvoted', handleUpvoted);
    socket.on('questionAnswered', handleAnswered);

    return () => {
      socket.off('questionApproved', handleApproved);
      socket.off('questionUpvoted', handleUpvoted);
      socket.off('questionAnswered', handleAnswered);
    };
  }, [socket, eventId, track]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!question.trim() || question.trim().length < 3) {
      setErrorMessage('Question must be at least 3 characters long.');
      return;
    }
    if (question.length > 500) {
      setErrorMessage('Question cannot exceed 500 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await questionApi.submitQuestion(eventId, {
        question: question.trim(),
        authorName: authorName.trim() || 'Anonymous',
        track,
        voterId
      });

      if (res.success) {
        setSuccessMessage('Your question has been submitted and is awaiting organizer approval!');
        setQuestion('');
        setTimeout(() => setSuccessMessage(''), 6000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (qId) => {
    if (upvotedIds.has(qId)) return;

    try {
      const res = await questionApi.upvoteQuestion(eventId, qId, voterId);
      if (res.success) {
        setUpvotedIds((prev) => new Set(prev).add(qId));
        setApprovedQuestions((prev) =>
          prev.map((q) => (q._id === qId ? { ...q, upvotes: res.data.upvotes } : q))
        );
      }
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Live Stage Audience Q&A</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Ask the Stage Speakers</h1>
        <p className="text-xs text-slate-400">Submit your questions live for the stage anchors and keynote speakers.</p>
      </div>

      {/* Track Selector */}
      <div className="flex bg-stage-900 p-1 rounded-xl border border-stage-800">
        {['Track A', 'Track B', 'Track C'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTrack(t)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              track === t
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="bg-stage-900/90 border border-stage-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex justify-between">
            <span>Your Question *</span>
            <span className={question.length > 450 ? 'text-amber-400' : 'text-slate-500'}>
              {question.length}/500
            </span>
          </label>
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question for the speaker..."
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
          className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {submitting ? (
            <span className="animate-spin border-2 border-slate-950 border-t-transparent rounded-full w-4 h-4" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Question</span>
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

        {approvedQuestions.length === 0 ? (
          <div className="text-center py-8 bg-stage-900/40 border border-stage-800/60 rounded-xl p-4 text-slate-500 text-xs">
            No approved questions on {track} yet. Be the first to ask!
          </div>
        ) : (
          approvedQuestions.map((q) => (
            <div
              key={q._id}
              className={`p-4 rounded-xl border transition-all ${
                q.status === 'ANSWERED' || q.isAnswered
                  ? 'bg-stage-900/40 border-stage-800/40 opacity-75'
                  : 'bg-stage-900 border-stage-800 hover:border-stage-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">{q.question || q.text}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <span>by {q.authorName || 'Anonymous'}</span>
                    {q.status === 'ANSWERED' && (
                      <span className="text-emerald-400 font-semibold text-[10px] uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Answered
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpvote(q._id)}
                  disabled={upvotedIds.has(q._id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    upvotedIds.has(q._id)
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-stage-800 border-stage-700 text-slate-300 hover:border-cyan-500/50 hover:text-white'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{q.upvotes || 0}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
