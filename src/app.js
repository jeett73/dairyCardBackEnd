import express from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";
import config from "./config/index.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(hpp());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(config.env === "production" ? "combined" : "dev"));
app.use("/uploads", express.static(path.resolve("uploads")));

const authLimiter = rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.max, standardHeaders: true, legacyHeaders: false });
app.use("/auth", authLimiter);

routes(app);

export default app;
