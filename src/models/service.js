import Joi from "joi";
import { getDb } from "../services/mongo.js";

export const collectionName = "services";

export function getCollection() {
  return getDb().collection(collectionName);
}

export const schema = Joi.object({
  milk: Joi.boolean().default(false),
  water: Joi.boolean().default(false)
});

export async function ensureIndexes(db) {
  const col = db.collection(collectionName);
  // No indexes required currently; placeholder to keep consistent API
}
