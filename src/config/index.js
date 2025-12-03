import dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().default(3000),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default("15m"),
  REFRESH_TOKEN_SECRET: Joi.string().min(16).required(),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().default("30d"),
  CORS_ORIGIN: Joi.string().default("*"),
  // REDIS_URL: Joi.string().uri().required(),
  MONGO_URL: Joi.string().uri().required(),
  MONGO_DB_NAME: Joi.string().required(),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(60000),
  RATE_LIMIT_MAX: Joi.number().default(10)
}).unknown();

const { value, error } = schema.validate(process.env);

if (error) {
  throw new Error(error.message);
}

const config = {
  env: value.NODE_ENV,
  port: value.PORT,
  jwt: { secret: value.JWT_SECRET, expiresIn: value.JWT_EXPIRES_IN },
  refreshJwt: { secret: value.REFRESH_TOKEN_SECRET, expiresIn: value.REFRESH_TOKEN_EXPIRES_IN },
  corsOrigin: value.CORS_ORIGIN,
  // redisUrl: value.REDIS_URL,
  mongoUrl: value.MONGO_URL,
  mongoDbName: value.MONGO_DB_NAME,
  rateLimit: { windowMs: value.RATE_LIMIT_WINDOW_MS, max: value.RATE_LIMIT_MAX }
};

export default config;
