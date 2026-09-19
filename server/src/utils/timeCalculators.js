/**
 * Adds minutes to a Date object and returns a new Date
 */
export const addMinutesToDate = (date, minutes) => {
  return new Date(new Date(date).getTime() + minutes * 60000);
};

/**
 * Calculates cascading start and end times across a list of ordered sessions
 * Given a cumulative delay, each subsequent session shifts accordingly.
 */
export const recalculateAgendaTimes = (sessions) => {
  let cumulativeOffsetMinutes = 0;

  return sessions.map((session, index) => {
    // If the session has its own explicit delayOffsetMinutes added
    cumulativeOffsetMinutes += (session.delayOffsetMinutes || 0);

    const calculatedStartTime = addMinutesToDate(
      session.scheduledStartTime,
      cumulativeOffsetMinutes
    );

    return {
      ...session.toObject ? session.toObject() : session,
      calculatedStartTime,
      cumulativeDelayMinutes: cumulativeOffsetMinutes
    };
  });
};
