import Joi from "joi";
import { getDb } from "../services/mongo.js";
import { wrapCollection } from "../utils/mongoWrapper.js";

export const collectionName = "shops";

export function getCollection() {
  return wrapCollection(getDb().collection(collectionName));
}

export const schema = Joi.object({
  isDeleted: Joi.boolean().default(false),
  isPlanActive: Joi.boolean().default(false),
  shopName: Joi.string().required(),
  shopOwnerName: Joi.string().allow(""),
  phone: Joi.string().length(10).required(),
  Address: Joi.object({
    street1: Joi.string().trim().required(),
    street2: Joi.string().trim(),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().default('Gujarat').optional(),
    postalCode: Joi.string().trim().required(),
    location: Joi.object({
      lat: Joi.number(),
      lng: Joi.number()
    })
  }),
  features: Joi.array().items(Joi.object()).default([]),
  uniqueId: Joi.string().required(),
  serviceId: Joi.string().hex().length(24).required(),
  password: Joi.string().allow(""),
  mpinHash: Joi.string().allow(""),
  refreshToken: Joi.array().items(
    Joi.object({
      refreshToken: Joi.string().required(),
      deviceId: Joi.string().required(),
    })
  ).default([]),
  createdAt: Joi.date().default(Date.now),
  modifiedAt: Joi.date().default(Date.now)
});

export async function ensureIndexes(db) {
  const col = db.collection(collectionName);
  await col.createIndex({ phone: 1 }, { unique: true });
}
