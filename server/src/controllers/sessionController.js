import { Session } from '../models/Session.js';
import { createSession, startLiveSession, saveSessionScript } from '../services/sessionService.js';
import { applySessionDelay } from '../services/eventService.js';

export const addSession = async (req, res, next) => {
  try {
    const session = await createSession(req.params.eventId, req.body);
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

export const triggerDelay = async (req, res, next) => {
  try {
    const { delayMinutes, reason } = req.body;
    let { eventId, sessionId } = req.params;

    if (!eventId) {
      const sess = await Session.findById(sessionId);
      if (sess) {
        eventId = sess.eventId;
      } else {
        return res.status(404).json({ success: false, message: 'Session not found' });
      }
    }

    const result = await applySessionDelay(eventId, sessionId, Number(delayMinutes), reason);
    res.status(200).json({
      success: true,
      message: `Delay of ${delayMinutes} mins successfully applied and cascaded`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const activateSession = async (req, res, next) => {
  try {
    let { eventId, sessionId } = req.params;

    if (!eventId) {
      const sess = await Session.findById(sessionId);
      if (sess) {
        eventId = sess.eventId;
      } else {
        return res.status(404).json({ success: false, message: 'Session not found' });
      }
    }

    const result = await startLiveSession(eventId, sessionId);
    res.status(200).json({
      success: true,
      message: 'Session is now LIVE',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const updateScript = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { scriptType, content } = req.body;

    const session = await saveSessionScript(sessionId, scriptType, content);
    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
};

export const updateTeleprompterProgress = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const {
      scrollProgress,
      lastWordIndex,
      paceWpm,
      lastSpokenSnippet,
      currentScriptType
    } = req.body;

    const session = await Session.findByIdAndUpdate(
      sessionId,
      {
        $set: {
          'teleprompterState.scrollProgress': Number(scrollProgress ?? 0),
          'teleprompterState.lastWordIndex': Number(lastWordIndex ?? 0),
          'teleprompterState.paceWpm': Number(paceWpm ?? 0),
          'teleprompterState.lastSpokenSnippet': String(lastSpokenSnippet ?? '').slice(0, 500),
          'teleprompterState.currentScriptType': currentScriptType ?? 'introduction',
          'teleprompterState.updatedAt': new Date()
        }
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Teleprompter progress updated',
      data: session.teleprompterState
    });
  } catch (error) {
    next(error);
  }
};
