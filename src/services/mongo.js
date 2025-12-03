import { MongoClient } from "mongodb";
import config from "../config/index.js";
import * as customerModel from "../models/customer.js";
import * as serviceModel from "../models/service.js";
import * as shopModel from "../models/shop.js";
import * as productModel from "../models/product.js";
import * as shopProductModel from "../models/shopProduct.js";
import * as cardModel from "../models/card.js";
import * as cardPaymentModel from "../models/cardPayment.js";

let client;
let db;
let collections;

export async function connectMongo() {
  if (db) return db;
  client = new MongoClient(config.mongoUrl);
  await client.connect();
  db = client.db(config.mongoDbName);
  collections = {
    users: db.collection("users"),
    customers: db.collection(customerModel.collectionName),
    services: db.collection(serviceModel.collectionName),
    shops: db.collection(shopModel.collectionName),
    products: db.collection(productModel.collectionName),
    shopProducts: db.collection(shopProductModel.collectionName),
    cards: db.collection(cardModel.collectionName),
    cardPayments: db.collection(cardPaymentModel.collectionName)
  };
  await customerModel.ensureIndexes(db);
  await serviceModel.ensureIndexes(db);
  await shopModel.ensureIndexes(db);
  await productModel.ensureIndexes(db);
  await shopProductModel.ensureIndexes(db);
  await cardModel.ensureIndexes(db);
  await cardPaymentModel.ensureIndexes(db);
  globalThis.db = db;
  globalThis.collections = collections;
  return db;
}

export function getDb() {
  if (!db) throw new Error("MongoDB not connected");
  return db;
}

export function getCollections() {
  if (!collections) throw new Error("MongoDB not connected");
  return collections;
}

export async function closeMongo() {
  if (!client) return;
  await client.close();
  client = undefined;
  db = undefined;
  collections = undefined;
  delete globalThis.db;
  delete globalThis.collections;
}
