import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const serviceAccountPath = path.join(process.cwd(), "firebaseKey.json");

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  console.warn("Service account key not found at " + serviceAccountPath);
}

export const messaging = admin.messaging();

export async function sendNotification(token, title, body, data = {}) {
  if (!token) return;
  try {
    const message = {
      notification: { title, body },
      data,
      token,
    };
    await messaging.send(message);
    console.log("Notification sent successfully");
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

