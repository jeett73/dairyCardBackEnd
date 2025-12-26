import { getCollection as getCustomerCollection } from "../models/customer.js";
import { collectionName as shopCollectionName } from "../models/shop.js";
import { ok, created, conflict, serverError } from "../utils/response.js";
import { ObjectId } from "mongodb";

export async function listCustomers(req, res) {
  try {
    const col = getCustomerCollection();
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const shopId = (req.query.shopId || "").toString();
    const q = (req.query.q || "").toString().trim();

    const filter = { isDeleted: { $ne: true }, shopId: new ObjectId(shopId) };
    if (q) {
      if (q.length < 3) {
        filter.cardNumber = q.toString()
      } else {
        filter.phone = q.toString() 
      }
    }

    const skip = (page - 1) * limit;
    const total = await col.countDocuments(filter);
    const customers = await col
      .aggregate([
        { $match: filter },
        { $sort: { name: 1, _id: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: shopCollectionName,
            let: { shopIdStr: "$shopId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$shopIdStr"] } } },
              { $project: { shopName: 1, phone: 1, Address: 1, isPlanActive: 1 } }
            ],
            as: "shop"
          }
        },
        { $addFields: { shop: { $arrayElemAt: ["$shop", 0] } } },
        {
          $project: {
            _id: 1,
            name: 1,
            cardNumber: 1,
            phone: 1
          }
        }
      ])
      .toArray();

    ok(res, { customers, page, limit, total });
  } catch {
    serverError(res);
  }
}

export async function createCustomer(req, res) {
  try {
    const col = getCustomerCollection();
    const doc = req.body;
    const shopId = new ObjectId(doc.shopId);
    const phone = (doc.phone || "").toString();
    const existing = await col.findOne({ shopId, phone });
    if (existing) {
      return conflict(res, "Customer already exists");
    }
    const insertDoc = { ...doc, isDeleted: false, shopId };
    const result = await col.insertOne(insertDoc);
    const createdDoc = await col.findOne({ _id: result.insertedId });
    created(res, { customer: createdDoc });
  } catch (err) {
    if (err && err.code === 11000) {
      return conflict(res, "Card number already exists");
    }
    serverError(res);
  }
}
