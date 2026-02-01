/**
 * Utility function to format errors for mantine notifications.
 * Prevents [Object object] from being displayed.
 */
export function formatNotificationError(error: unknown): string {
  if (typeof error === 'string') return error;
  if (!error || typeof error !== 'object') return 'An unexpected error occurred';

  // Helper to extract a readable message from various object shapes
  const extractMessage = (obj: unknown): string | null => {
    if (typeof obj === 'string') return obj;
    if (!obj || typeof obj !== 'object') return null;

    const record = obj as Record<string, unknown>;

    // 1. Look for priority keys that usually contain strings or arrays of strings
    const priorityKeys = ['message', 'msg', 'error', 'detail', 'details'];
    for (const key of priorityKeys) {
      const val = record[key];
      if (typeof val === 'string' && val !== '[object Object]') return val;
      if (Array.isArray(val)) {
        const messages = val.map(v => extractMessage(v)).filter(Boolean);
        if (messages.length > 0) return messages.join('. ');
      }
      if (typeof val === 'object' && val !== null) {
        const nested = extractMessage(val);
        if (nested) return nested;
      }
    }

    // 2. Scan for any arrays (likely lists of error strings or objects)
    for (const key in record) {
      const val = record[key];
      if (Array.isArray(val)) {
        const messages = val.map((v) => extractMessage(v)).filter(Boolean);
        if (messages.length > 0) return messages.join('. ');
      }
    }

    // 3. Last resort: check if any string exists in the object
    for (const key in record) {
       const val = record[key];
       if (typeof val === 'string' && val !== '[object Object]') return val;
    }

    return null;
  };

  const message = extractMessage(error);
  if (message) return message;

  if (error instanceof Error) return error.message;

  try {
    return JSON.stringify(error);
  } catch {
    return 'An unexpected error occurred';
  }
}
