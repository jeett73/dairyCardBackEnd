import Joi from 'joi';
import { ObjectId } from 'mongodb';
import { getDb } from '../services/mongo.js';

export const collectionName = 'customers';

export function getCollection() {
  return getDb().collection(collectionName);
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
  shopId: Joi.string()
    .hex()
    .length(24)
    .required()
    .custom((value, helpers) => {
      try {
        return new ObjectId(value);
      } catch {
        return helpers.error('any.invalid');
      }
    }),
  mpinHash: Joi.string().allow(''),
  refreshToken: Joi.string().allow('').default(''),
});

export async function ensureIndexes(db) {
  const col = db.collection(collectionName);
  await col.createIndex({ cardNumber: 1 }, { unique: true, sparse: true });
  await col.createIndex({ shopId: 1 });
}
