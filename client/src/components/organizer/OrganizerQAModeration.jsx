import React, { useState, useEffect, useContext } from 'react';
import { Check, X, Filter, ThumbsUp, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import { questionApi } from '../../api/questionApi';
import { SocketContext } from '../../context/SocketContext';

export const OrganizerQAModeration = ({ eventId }) => {
  const { socket } = useContext(SocketContext);
  const [questions, setQuestions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const fetchQuestions = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const res = await questionApi.getQuestions(eventId, {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        sort: 'upvotes'
      });
      if (res.success && res.data) {
        setQuestions(res.data);
      }
    } catch (err) {
      console.error('Error fetching organizer questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [eventId, statusFilter]);

  // Real-time socket listener for organizer
  useEffect(() => {
    if (!socket || !eventId) return;

    socket.emit('joinEvent', { eventId, role: 'ORGANIZER' });

    const handleSubmitted = (payload) => {
      const q = payload.question || payload;
      if (q && q._id) {
        setQuestions((prev) => [q, ...prev.filter((item) => item._id !== q._id)]);
      }
    };

    const handleApproved = (payload) => {
      setQuestions((prev) =>
        prev.map((q) => (q._id === payload.questionId ? { ...q, status: 'APPROVED' } : q))
      );
    };

    const handleRejected = (payload) => {
      setQuestions((prev) =>
        prev.map((q) => (q._id === payload.questionId ? { ...q, status: 'REJECTED' } : q))
      );
    };

    const handleUpvoted = (payload) => {
      setQuestions((prev) =>
        prev.map((q) => (q._id === payload.questionId ? { ...q, upvotes: payload.upvotes } : q))
      );
    };

    const handleAnswered = (payload) => {
      setQuestions((prev) =>
        prev.map((q) => (q._id === payload.questionId ? { ...q, status: 'ANSWERED' } : q))
      );
    };

    socket.on('questionSubmitted', handleSubmitted);
    socket.on('new_question', handleSubmitted);
    socket.on('questionApproved', handleApproved);
    socket.on('questionRejected', handleRejected);
    socket.on('questionUpvoted', handleUpvoted);
    socket.on('questionAnswered', handleAnswered);

    return () => {
      socket.off('questionSubmitted', handleSubmitted);
      socket.off('new_question', handleSubmitted);
      socket.off('questionApproved', handleApproved);
      socket.off('questionRejected', handleRejected);
      socket.off('questionUpvoted', handleUpvoted);
      socket.off('questionAnswered', handleAnswered);
    };
  }, [socket, eventId]);

  const handleApprove = async (qId) => {
    try {
      const res = await questionApi.approveQuestion(eventId, qId);
      if (res.success) {
        setQuestions((prev) =>
          prev.map((q) => (q._id === qId ? { ...q, status: 'APPROVED' } : q))
        );
      }
    } catch (err) {
      console.error('Approve failed:', err);
    }
  };

  const handleReject = async (qId) => {
    try {
      const res = await questionApi.rejectQuestion(eventId, qId);
      if (res.success) {
        setQuestions((prev) =>
          prev.map((q) => (q._id === qId ? { ...q, status: 'REJECTED' } : q))
        );
      }
    } catch (err) {
      console.error('Reject failed:', err);
    }
  };

  const pendingCount = questions.filter((q) => q.status === 'PENDING').length;

  return (
    <div className="bg-stage-900 border border-stage-800 rounded-2xl p-6 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stage-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Audience Q&A Moderation Queue</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                  {pendingCount} Pending
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">Review and moderate incoming live audience questions before stage broadcast.</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-stage-950 p-1 rounded-xl border border-stage-800 text-xs font-semibold">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'ANSWERED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === st
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <span className="animate-spin border-2 border-cyan-400 border-t-transparent rounded-full w-4 h-4" />
          <span>Loading live questions...</span>
        </div>
      ) : questions.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs bg-stage-950/40 rounded-xl border border-stage-800/60">
          No questions found matching status filter "{statusFilter}".
        </div>
      ) : (
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {questions.map((q) => (
            <div
              key={q._id}
              className={`p-4 rounded-2xl border transition-all duration-300 animate-fade-in ${
                q.status === 'PENDING'
                  ? 'bg-gradient-to-r from-stage-900 to-amber-950/20 border-amber-500/40 shadow-md shadow-amber-950/30'
                  : q.status === 'APPROVED'
                  ? 'bg-gradient-to-r from-stage-900 to-emerald-950/20 border-emerald-500/40 shadow-md shadow-emerald-950/30'
                  : q.status === 'REJECTED'
                  ? 'bg-stage-950/60 border-rose-500/20 opacity-60'
                  : 'bg-stage-900 border-stage-800'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-[260px]">
                  <p className="text-sm font-semibold text-white leading-relaxed">{q.question || q.text}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="font-bold text-slate-200">by {q.authorName || 'Audience Member'}</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-stage-800 border border-stage-700 text-cyan-300 text-[10px] font-mono font-bold uppercase">
                      {q.track || q.trackId || 'Track A'}
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{q.upvotes || 0} upvotes</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase border shadow-sm ${
                      q.status === 'PENDING'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : q.status === 'APPROVED'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : q.status === 'REJECTED'
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                    }`}
                  >
                    {q.status}
                  </span>

                  {q.status === 'PENDING' && (
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(q._id)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(q._id)}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
