import Joi from "joi";
import { getDb } from "../services/mongo.js";

export const collectionName = "shopProducts";

export function getCollection() {
  return getDb().collection(collectionName);
}

export const schema = Joi.object({
  shopId: Joi.string().hex().length(24).required(),
  price: Joi.number().required(),
  productId: Joi.string().hex().length(24).required()
});

export async function ensureIndexes(db) {
  const col = db.collection(collectionName);
  await col.createIndex({ shopId: 1, productId: 1 }, { unique: true });
}

