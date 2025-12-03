import Joi from "joi";
import { schema as customerDocSchema } from "../models/customer.js";

export const listCustomersSchema = Joi.object({
  query: Joi.object({
    shopId: Joi.string().hex().length(24).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    q: Joi.string().allow("").default("")
  })
});

export const createCustomerSchema = Joi.object({
  body: customerDocSchema.fork(["isDeleted", "mpinHash"], (s) => s.forbidden())
});
