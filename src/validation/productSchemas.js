import Joi from "joi";
import { schema as productDocSchema } from "../models/product.js";

export const createProductSchema = Joi.object({
  body: productDocSchema.fork(["icon", "isDeleted"], (s) => s.forbidden()).keys({
    name: Joi.string().required()
  })
});

export const listProductsSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().allow("").default("")
  })
});
