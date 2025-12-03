import Joi from "joi";
import { getDb } from "../services/mongo.js";

export const collectionName = "cards";

export function getCollection() {
  return getDb().collection(collectionName);
}

export const schema = Joi.object({
  customerId: Joi.string().hex().length(24).required(),
  shopId: Joi.string().hex().length(24).required(),
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(1900).required(),
  products: Joi.array().items(
    Joi.object({
      day: Joi.number().integer().min(1).max(31).required(),
      product: Joi.array().items(
        Joi.object({
          productId: Joi.string().hex().length(24).required(),
          "date&Time": Joi.string().required(),
          qty: Joi.number().integer().min(1).required(),
          price: Joi.number().min(0).required()
        })
      ).required()
    })
  ).default([]),
  totalBill: Joi.number().default(0)
});

export async function ensureIndexes(db) {
  const col = db.collection(collectionName);
  await col.createIndex({ customerId: 1, shopId: 1, month: 1, year: 1 }, { unique: true });
}

