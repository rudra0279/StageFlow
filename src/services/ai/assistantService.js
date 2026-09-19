// src/services/ai/assistantService.js
const { buildEventContext } = require('./contextBuilder');
const { generateScript } = require('./aiService');
const { logger } = require('../../utils/logger');

/**
 * Handles conversational queries from live event anchors with context grounding.
 * @param {string} eventId
 * @param {string} query - Command or question
 * @param {object} options - Optional tone, maxLength
 */
async function queryAnchorAssistant(eventId, query, options = {}) {
  logger.ai(`Anchor Assistant command: "${query}" for event: ${eventId}`);

  const context = await buildEventContext(eventId, {
    userQuery: query,
    tone: options.tone || 'clear, confident, and supportive',
    maxLength: options.maxLength || 120,
  });

  const result = await generateScript('assistant', {
    ...context,
    userQuery: query,
  });

  return {
    ...result,
    context,
  };
}

module.exports = { queryAnchorAssistant };
