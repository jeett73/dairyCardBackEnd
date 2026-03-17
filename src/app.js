import express from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import hpp from "hpp";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import routes from "./routes/index.js";
import config from "./config/index.js";

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());
app.use(hpp());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
/* Logging */
app.use(
    morgan(config.env === "production"
        ? ":remote-addr :method :url :status :response-time ms"
        : "dev"
    )
);
app.use("/uploads", express.static(path.resolve("src/uploads")));

const authLimiter = rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.max, standardHeaders: true, legacyHeaders: false, keyGenerator: (req) => ipKeyGenerator(req.headers["cf-connecting-ip"] || req.ip) });
app.use("/auth", authLimiter);

routes(app);

/* 404 handler */
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

/* Global error handler */
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error"
    });
});

export default app;
