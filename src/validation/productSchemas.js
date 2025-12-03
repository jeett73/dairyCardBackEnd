import Joi from "joi";
import { schema as productDocSchema } from "../models/product.js";

export const createProductSchema = Joi.object({
  body: productDocSchema.fork(["icon", "isDeleted"], (s) => s.forbidden()).keys({
    name: Joi.string().required()
  })
});

export const listProductsSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    q: Joi.string().allow("").default("")
  })
});
