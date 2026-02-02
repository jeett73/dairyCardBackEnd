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

export const getCustomerByIdSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  })
});

export const updateCustomerSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
    name: Joi.string(),
    cardNumber: Joi.string(),
    street1: Joi.string().trim(),
    phone: Joi.string().trim(),
    regularProduct: Joi.array().items(
      Joi.object({
        productId: Joi.string().hex().length(24).required(),
        qty: Joi.number().required(),
      })
    )
  }).min(1)
});
