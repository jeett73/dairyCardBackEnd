import Joi from 'joi';
import { ObjectId } from 'mongodb';
import { getDb } from '../services/mongo.js';
import { wrapCollection } from '../utils/mongoWrapper.js';

export const collectionName = 'customers';

export function getCollection() {
  return wrapCollection(getDb().collection(collectionName));
}

export const schema = Joi.object({
  isDeleted: Joi.boolean().default(false),
  name: Joi.string().required(),
  address: Joi.object({
    street1: Joi.string().trim().required(),
    street2: Joi.string().allow('').trim(),
    city: Joi.string().trim().optional(),
    state: Joi.string().trim().default('Gujarat').optional(),
    postalCode: Joi.string().allow('').trim().optional(),
    location: Joi.object({
      lat: Joi.number(),
      lng: Joi.number(),
    }),
  }),
  phone: Joi.string().length(10).required(),
  cardNumber: Joi.string().required(),
  regularProduct: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().hex().length(24).required(),
        qty: Joi.number().required(),
      }),
    )
    .optional(),
  depositeAmount: Joi.number().default(0),
  shopId: Joi.string().hex().length(24).required().custom((value, helpers) => {
    try {
      return new ObjectId(value);
    } catch {
      return helpers.error("any.invalid");
    }
  }),
  mpinHash: Joi.string().allow(""),
  refreshToken: Joi.array().items(
    Joi.object({
      refreshToken: Joi.string().required(),
      deviceId: Joi.string().required(),
    })
  ).default([]),
  fcmToken: Joi.array().items(
    Joi.object({
      fcmToken: Joi.string().required(),
      deviceId: Joi.string().required(),
    })
  ).default([]),
  createdAt: Joi.date().default(Date.now),
  modifiedAt: Joi.date().default(Date.now)
});

export async function ensureIndexes(db) {
  const col = db.collection(collectionName);
  await col.createIndex({ cardNumber: 1, phone: 1, shopId: 1 }, { unique: true })
}
