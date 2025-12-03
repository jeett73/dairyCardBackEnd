import Joi from "joi";
import { schema as cardDocSchema } from "../models/card.js";

export const addOrderSchema = Joi.object({
  body: Joi.object({
    customerId: Joi.string().hex().length(24).required(),
    shopId: Joi.string().hex().length(24).required(),
    products: Joi.array()
      .items(
        Joi.object({
          day: Joi.number().integer().min(1).max(31).required(),
          product: Joi.array()
            .items(
              Joi.object({
                productId: Joi.string().hex().length(24).required(),
                time: Joi.number().required(),
                qty: Joi.number().integer().min(1).required(),
                price: Joi.number().min(0).required()
              })
            )
            .required()
        })
      )
      .min(1)
      .required()
  })
});

