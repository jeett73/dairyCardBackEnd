import Joi from "joi";
import { getDb } from "../services/mongo.js";
import { wrapCollection } from "../utils/mongoWrapper.js";

export const collectionName = "services";

export function getCollection() {
  return wrapCollection(getDb().collection(collectionName));
}

export const schema = Joi.object({
  milk: Joi.boolean().default(false),
  water: Joi.boolean().default(false),
  createdAt: Joi.date().default(Date.now),
  modifiedAt: Joi.date().default(Date.now)
});

export async function ensureIndexes(db) {
  const col = db.collection(collectionName);
  // No indexes required currently; placeholder to keep consistent API
}
