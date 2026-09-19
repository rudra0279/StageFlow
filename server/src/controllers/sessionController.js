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
    const { eventId, sessionId } = req.params;

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
    const { eventId, sessionId } = req.params;
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
