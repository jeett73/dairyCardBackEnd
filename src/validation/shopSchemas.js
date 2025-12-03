import Joi from "joi";
import { schema as shopDocSchema } from "../models/shop.js";

export const createShopSchema = Joi.object({
  body: shopDocSchema.fork(["uniqueId"], (s) => s.forbidden())
});

export const updateShopSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
    isDeleted: Joi.boolean(),
    isPlanActive: Joi.boolean(),
    shopName: Joi.string(),
    shopOwnerName: Joi.string().allow(""),
    phone: Joi.string().length(10),
    Address: Joi.object({
      street1: Joi.string().trim(),
      street2: Joi.string().trim(),
      city: Joi.string().trim(),
      state: Joi.string().trim(),
      postalCode: Joi.string().trim(),
      location: Joi.object({
        lat: Joi.number(),
        lng: Joi.number()
      })
    }),
    features: Joi.array().items(Joi.object()),
    uniqueId: Joi.string(),
    serviceId: Joi.string().hex().length(24)
  })
});

export const updatePlanSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
    isPlanActive: Joi.boolean().required()
  })
});

export const listShopsSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    q: Joi.string().allow("").default(""),
    serviceId: Joi.string().hex().length(24)
  })
});
