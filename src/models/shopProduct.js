import Joi from "joi";
import { getDb } from "../services/mongo.js";
import { wrapCollection } from "../utils/mongoWrapper.js";

export const collectionName = "shopProducts";

export function getCollection() {
  return wrapCollection(getDb().collection(collectionName));
}

export const schema = Joi.object({
  shopId: Joi.string().hex().length(24).required(),
  price: Joi.number().required(),
  productId: Joi.string().hex().length(24).required(),
  createdAt: Joi.date().default(Date.now),
  modifiedAt: Joi.date().default(Date.now)
});

export async function ensureIndexes(db) {
  const col = db.collection(collectionName);
  await col.createIndex({ shopId: 1, productId: 1 }, { unique: true });
}

