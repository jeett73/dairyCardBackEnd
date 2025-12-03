import app from "./app.js";
import { connectRedis } from "./services/redis.js";
import { initMockStore } from "./db/mockUserStore.js";
import config from "./config/index.js";
import { connectMongo } from "./services/mongo.js";

async function start() {
  await connectMongo();
  // await connectRedis();
  // await initMockStore();
  app.listen(config.port, () => {});
}

start();
