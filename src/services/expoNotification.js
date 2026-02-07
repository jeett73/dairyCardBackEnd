import { messaging } from './firebase.js';

/**
 * Send push notifications to an array of tokens using Firebase Cloud Messaging.
 *
 * @param {string[]} tokens - An array of FCM tokens.
 * @param {string} title - The title of the notification.
 * @param {string} body - The body of the notification.
 * @param {object} data - Extra data to send with the notification.
 */
export async function sendPushNotificationsAsync(tokens, title, body, data = {}) {
  // Ensure tokens is an array and filter out invalid ones
  const validTokens = Array.isArray(tokens) ? tokens.filter(t => t && typeof t === 'string') : [];

  if (validTokens.length === 0) {
    console.warn('No valid FCM tokens provided for notification');
    return [];
  }

  const messages = validTokens.map(token => ({
    token,
    notification: {
      title,
      body,
    },
    data: data,
  }));

  // Firebase Admin SDK sendEach (for batch sending) or loop through and send individual
  // sendEach is more efficient for batch, but let's check if we want individual handling or batch.
  // usage of sendPushNotificationsAsync in cardController implies "fire and forget" mostly, but it returns tickets.
  // We need to return something similar to tickets or just void if not used.
  // checking original code: it returns tickets with status.
  
  // existing call in cardController awaits it but doesn't seem to use the result (tickets).
  // verification: grep didn't show usage of the returned value in cardController.
  
  const responses = [];
  
  // We can use sendEachForMulticast if sending same message to multiple tokens,
  // but here we are constructing individual messages because existing structure allowed per-token customization logic if needed?
  // Actually original code constructed same message for all tokens.
  // So we can use sendEachForMulticast which is optimized.
  
  if (validTokens.length > 500) {
     // Batching if needed, but unlikely for this app scope based on context
  }

  try {
    const message = {
      notification: { title, body },
      data: data,
      tokens: validTokens
    };
    
    const response = await messaging.sendEachForMulticast(message);
    
    // Log failures
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(validTokens[idx]);
          console.error(`Failure sending notification to ${validTokens[idx]}:`, resp.error);
        }
      });
      console.log('Failed tokens:', failedTokens);
    }

    return response;
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return null; 
  }
}

// Deprecated or no-op functions to maintain compatibility if called elsewhere (checked grep, only checkPushNotificationReceipts was exported and not used in controller)
// But expoNotification.js had `checkPushNotificationReceipts`.
// I should verify if `checkPushNotificationReceipts` is used anywhere. 
// Grep showed:
// {"File":"d:\\dailyCardBackend\\src\\services\\expoNotification.js","LineNumber":81,"LineContent":"export async function checkPushNotificationReceipts(tickets) {"}
// It explains it's exported. I'll check if it's imported anywhere.
// Grep results for `checkPushNotificationReceipts`:
// zero results in other files from my previous grep? Wait, I didn't grep for `checkPushNotificationReceipts`, I grepped for `sendPushNotificationsAsync`. 
// Let me double check if I should keep it.

