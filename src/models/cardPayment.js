import Joi from "joi";
import { getDb } from "../services/mongo.js";

export const collectionName = "cardPayments";

export function getCollection() {
  return getDb().collection(collectionName);
}

export const schema = Joi.object({
  customerId: Joi.string().hex().length(24).required(),
  shopId: Joi.string().hex().length(24).required(),
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(1900).required(),
  amountPaid: Joi.number().required(),
  "date&Time": Joi.string().required(),
  cardId: Joi.string().hex().length(24).required()
});

export async function ensureIndexes(db) {
  const col = db.collection(collectionName);
  await col.createIndex({ cardId: 1 });
  await col.createIndex({ customerId: 1, shopId: 1, month: 1, year: 1 });
}

