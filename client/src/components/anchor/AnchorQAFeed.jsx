import React, { useState, useEffect, useContext } from 'react';
import { Sparkles, ThumbsUp, CheckCircle, FileText, Minimize2, ListOrdered, Share2, MessageSquare } from 'lucide-react';
import { questionApi } from '../../api/questionApi';
import { SocketContext } from '../../context/SocketContext';

export const AnchorQAFeed = ({ eventId, track, onAiAssistResult }) => {
  const { socket } = useContext(SocketContext);
  const [approvedQuestions, setApprovedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeAssistQId, setActiveAssistQId] = useState(null);
  const [assistAction, setAssistAction] = useState(null);

  const fetchAnchorFeed = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const res = await questionApi.getAnchorFeed(eventId, track);
      if (res.success && res.data) {
        setApprovedQuestions(res.data);
      }
    } catch (err) {
      console.error('Error fetching anchor Q&A feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnchorFeed();
  }, [eventId, track]);

  // Socket listener for Anchor Station
  useEffect(() => {
    if (!socket || !eventId) return;

    socket.emit('joinEvent', { eventId, role: 'ANCHOR', track });

    const handleApproved = (payload) => {
      const q = payload.question || payload;
      if (q && q._id) {
        setApprovedQuestions((prev) => [q, ...prev.filter((item) => item._id !== q._id)]);
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

  const handleAiAction = async (questionObj, action) => {
    try {
      setActiveAssistQId(questionObj._id);
      setAssistAction(action);

      const res = await questionApi.getAiQuestionAssist({
        eventId,
        questionId: questionObj._id,
        question: questionObj.question || questionObj.text,
        action,
        track
      });

      if (res.success && res.data) {
        if (typeof onAiAssistResult === 'function') {
          onAiAssistResult({
            action,
            result: res.data.result,
            questionText: questionObj.question || questionObj.text,
            authorName: questionObj.authorName
          });
        }
      }
    } catch (err) {
      console.error(`AI Assist [${action}] failed:`, err);
    } finally {
      setActiveAssistQId(null);
      setAssistAction(null);
    }
  };

  const handleMarkAnswered = async (qId) => {
    try {
      const res = await questionApi.answerQuestion(eventId, qId);
      if (res.success) {
        setApprovedQuestions((prev) =>
          prev.map((q) => (q._id === qId ? { ...q, status: 'ANSWERED', isAnswered: true } : q))
        );
      }
    } catch (err) {
      console.error('Mark answered failed:', err);
    }
  };

  return (
    <div className="bg-stage-900 border border-stage-800 rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stage-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Live Anchor Q&A Feed</h3>
            <p className="text-[10px] text-slate-400">Approved stage questions for {track || 'Current Track'}</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-bold">
          {approvedQuestions.length} Approved
        </span>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="py-8 text-center text-slate-400 text-xs">Loading approved questions...</div>
      ) : approvedQuestions.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs bg-stage-950/40 rounded-xl border border-stage-800/60">
          No approved questions for {track || 'this track'} yet.
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {approvedQuestions.map((q) => {
            const isAnswered = q.status === 'ANSWERED' || q.isAnswered;
            const isProcessing = activeAssistQId === q._id;

            return (
              <div
                key={q._id}
                className={`p-4 rounded-xl border transition-all ${
                  isAnswered
                    ? 'bg-stage-950/50 border-stage-800/40 opacity-70'
                    : 'bg-stage-950 border-stage-800 hover:border-cyan-500/40'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-white leading-relaxed">{q.question || q.text}</p>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-stage-900 border border-stage-800 text-xs text-slate-300 font-bold shrink-0">
                      <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{q.upvotes || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>by {q.authorName || 'Anonymous'}</span>
                    {isAnswered ? (
                      <span className="text-emerald-400 font-bold text-[10px] uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Answered
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMarkAnswered(q._id)}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] hover:underline"
                      >
                        Mark Answered
                      </button>
                    )}
                  </div>

                  {/* AI Assistance Action Toolbar */}
                  {!isAnswered && (
                    <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-stage-800/60">
                      <button
                        type="button"
                        onClick={() => handleAiAction(q, 'summarize')}
                        disabled={isProcessing}
                        className="px-2.5 py-1 bg-stage-900 hover:bg-stage-800 border border-stage-700 text-slate-200 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-all"
                      >
                        <FileText className="w-3 h-3 text-cyan-400" />
                        <span>Summarize</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAiAction(q, 'shorten')}
                        disabled={isProcessing}
                        className="px-2.5 py-1 bg-stage-900 hover:bg-stage-800 border border-stage-700 text-slate-200 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Minimize2 className="w-3 h-3 text-purple-400" />
                        <span>Shorten</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAiAction(q, 'response_structure')}
                        disabled={isProcessing}
                        className="px-2.5 py-1 bg-stage-900 hover:bg-stage-800 border border-stage-700 text-slate-200 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-all"
                      >
                        <ListOrdered className="w-3 h-3 text-amber-400" />
                        <span>Structure</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAiAction(q, 'transition')}
                        disabled={isProcessing}
                        className="px-2.5 py-1 bg-stage-900 hover:bg-stage-800 border border-stage-700 text-slate-200 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Share2 className="w-3 h-3 text-emerald-400" />
                        <span>Transition</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAiAction(q, 'relevance')}
                        disabled={isProcessing}
                        className="px-2.5 py-1 bg-stage-900 hover:bg-stage-800 border border-stage-700 text-slate-200 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>Relevance</span>
                      </button>

                      {isProcessing && (
                        <span className="ml-auto text-[10px] text-cyan-400 animate-pulse font-mono">
                          Generating {assistAction}...
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
