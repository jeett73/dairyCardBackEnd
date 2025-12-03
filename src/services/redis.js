import { createClient } from "redis";
import config from "../config/index.js";

let client;

export async function connectRedis() {
  if (client) return client;
  client = createClient({ url: config.redisUrl });
  client.on("error", () => {});
  await client.connect();
  return client;
}

export function getRedis() {
  if (!client) throw new Error("Redis not connected");
  return client;
}
