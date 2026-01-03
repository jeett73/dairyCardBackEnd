import { Expo } from 'expo-server-sdk';

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const expo = new Expo();

/**
 * Send push notifications to an array of Expo push tokens.
 *
 * @param {string[]} somePushTokens - An array of Expo push tokens.
 * @param {string} title - The title of the notification.
 * @param {string} body - The body of the notification.
 * @param {object} data - Extra data to send with the notification.
 */
export async function sendPushNotificationsAsync(somePushTokens, title, body, data = {}) {
  // Create the messages that you want to send to clients
  let messages = [];
  for (let pushToken of somePushTokens) {
    // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
    messages.push({
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
    });
  }

  // The Expo push notification service accepts batches of notifications so
  // that you don't need to send 1000 requests to send 1000 notifications.
  // We recommend you batch your notifications to reduce the number of requests
  // and to compress them (notifications with similar content will get
  // compressed).
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];

  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(ticketChunk);
      tickets.push(...ticketChunk);
      // NOTE: If a ticket contains an error code in ticket.details.error, you
      // must handle it. For example, invalid credentials or a user unsubscribed.
    } catch (error) {
      console.error(error);
    }
  }

  // Later, after the Expo push notification service has delivered the
  // notifications to Apple or Google (or the push notification service was
  // unable to deliver the notification to some push tokens), the code from Expo
  // will be included in the receipt. The ID of each receipt is sent back in
  // the response "ticket" for each notification. In summary, sending a
  // notification produces a ticket, which contains a receipt ID you later use
  // to get the receipt.
  //
  // The receipts may contain error codes to which you must respond. In
  // particular, Apple or Google may block apps that continue to send
  // notifications to devices that have blocked notifications or have uninstalled
  // your app. Expo does not control this policy and sends back the feedback from
  // Apple and Google so you can handle it appropriately.
  
  // You may want to return tickets to handle receipt checking later
  return tickets;
}

/**
 * Check the status of the push notification tickets to see if there were any errors.
 * This is useful for debugging and handling specific error cases.
 * 
 * @param {object[]} tickets - The tickets returned from sendPushNotificationsAsync
 */
export async function checkPushNotificationReceipts(tickets) {
    let receiptIds = [];
    for (let ticket of tickets) {
      // NOTE: Not all tickets have IDs; for example, tickets for notifications
      // that could not be enqueued will have error information and no receipt ID.
      if (ticket.id) {
        receiptIds.push(ticket.id);
      }
    }
  
    let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    for (let chunk of receiptIdChunks) {
      try {
        let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        console.log(receipts);
  
        // The receipts specify whether Apple or Google successfully received the
        // notification and information about an error, if one occurred.
        for (let receiptId in receipts) {
          let { status, message, details } = receipts[receiptId];
          if (status === 'ok') {
            continue;
          } else if (status === 'error') {
            console.error(
              `There was an error sending a notification: ${message}`
            );
            if (details && details.error) {
              // The error codes are listed in the Expo documentation:
              // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
              // You must handle the errors appropriately.
              console.error(`Error code: ${details.error}`);
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
