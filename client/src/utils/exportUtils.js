import { eventApi } from '../api/eventApi';

/**
 * Triggers the Run-of-Show PDF export and file download for a given event ID.
 * @param {string} eventId - ID of the event to export
 * @param {string} [eventTitle] - Title of the event (used for fallback filename)
 * @returns {Promise<{ success: boolean, filename: string }>}
 */
export const exportRunOfShowPdf = async (eventId, eventTitle = 'Event') => {
  if (!eventId) {
    throw new Error('Event ID is required to export Run-of-Show PDF.');
  }

  try {
    const response = await eventApi.exportRunOfShowPdf(eventId);
    
    // Extract filename from Content-Disposition header if available
    let filename = `Run-Of-Show-${eventTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    const disposition = response?.headers?.['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename=["']?([^"';]+)["']?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    // Create a Blob from the binary response
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    
    // Trigger browser file download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Clean up temporary DOM element and blob URL
    document.body.removeChild(link);
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
    }, 1000);

    return { success: true, filename };
  } catch (err) {
    console.error('[Export] Run-of-Show export failed:', err);
    let message = 'Unable to generate Run-of-Show PDF. Please try again.';
    if (err.response && err.response.data) {
      if (typeof err.response.data === 'string') {
        message = err.response.data;
      } else if (err.response.data.message) {
        message = err.response.data.message;
      }
    } else if (err.message && !err.message.includes('Axios')) {
      message = err.message;
    }
    throw new Error(message);
  }
};
