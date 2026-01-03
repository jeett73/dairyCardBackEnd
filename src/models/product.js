import Joi from "joi";
import { getDb } from "../services/mongo.js";
import { wrapCollection } from "../utils/mongoWrapper.js";

export const collectionName = "products";

export function getCollection() {
  return wrapCollection(getDb().collection(collectionName));
}

export const schema = Joi.object({
  isDeleted: Joi.boolean().default(false),
  name: Joi.string().required(),
  icon: Joi.string().allow(""),
  createdAt: Joi.date().default(Date.now),
  modifiedAt: Joi.date().default(Date.now)
});

export async function ensureIndexes(db) {
  const col = db.collection(collectionName);
  await col.createIndex({ name: 1 });
}

