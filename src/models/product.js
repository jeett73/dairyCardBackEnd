import Joi from "joi";
import { getDb } from "../services/mongo.js";

export const collectionName = "products";

export function getCollection() {
  return getDb().collection(collectionName);
}

export const schema = Joi.object({
  isDeleted: Joi.boolean().default(false),
  name: Joi.string().required(),
  icon: Joi.string().allow("")
});

export async function ensureIndexes(db) {
  const col = db.collection(collectionName);
  await col.createIndex({ name: 1 });
}

