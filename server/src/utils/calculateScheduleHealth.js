import { HEALTH_STATUS } from '../constants/eventStatus.js';

/**
 * Calculates event health status based on cumulative delay minutes:
 * - 0 to 5 mins: ON_SCHEDULE
 * - 6 to 20 mins: RUNNING_LATE
 * - 20+ mins: DISRUPTED
 */
export const calculateScheduleHealth = (totalDelayMinutes) => {
  if (totalDelayMinutes <= 5) {
    return HEALTH_STATUS.ON_SCHEDULE;
  } else if (totalDelayMinutes <= 20) {
    return HEALTH_STATUS.RUNNING_LATE;
  } else {
    return HEALTH_STATUS.DISRUPTED;
  }
};
