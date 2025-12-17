import { ObjectId } from "mongodb";
import { getCollection as getCardCollection } from "../models/card.js";
import { collectionName as shopProductCollectionName } from "../models/shopProduct.js";
import { collectionName as productCollectionName } from "../models/product.js";
import { ok, serverError } from "../utils/response.js";

export async function addOrder(req, res) {
  try {
    const col = getCardCollection();
    const customerId = (req.body.customerId || "").toString();
    const shopId = (req.body.shopId || "").toString();
    const products = Array.isArray(req.body.products) ? req.body.products : [];

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let card = await col.findOne({ customerId : new ObjectId(customerId), shopId: new ObjectId(shopId), month, year });
    if (!card) {
      const insertDoc = { customerId : new ObjectId(customerId), shopId: new ObjectId(shopId), month, year, products: [], totalBill: 0 };
      const result = await col.insertOne(insertDoc);
      card = await col.findOne({ _id: result.insertedId });
    }

    const additions = products;
    const dayMap = new Map();
    for (const entry of card.products) {
      dayMap.set(entry.day, entry);
    }
    for (const entry of additions) {
      const existing = dayMap.get(entry.day);
      if (existing) {
        existing.product.push(...entry.product);
      } else {
        dayMap.set(entry.day, { day: entry.day, product: [...entry.product] });
      }
    }
    const merged = Array.from(dayMap.values()).sort((a, b) => a.day - b.day);

    let delta = 0;
    for (const e of additions) {
      for (const p of e.product) {
        delta += Number(p.qty) * Number(p.price);
      }
    }

    const totalBill = Number(card.totalBill || 0) + delta;

    const updated = await col.findOneAndUpdate(
      { _id: card._id },
      { $set: { products: merged, totalBill } },
      { returnDocument: "after" }
    );
    ok(res, { card: updated.value });
  } catch {
    serverError(res);
  }
}

export async function getCardDetails(req, res) {
  try {
    const col = getCardCollection();
    const { customerId, shopId } = req.query;

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const pipeline = [
      {
        $match: {
          customerId: new ObjectId(customerId),
          shopId: new ObjectId(shopId),
          month: month,
          year: year
        }
      },
      { $unwind: { path: "$products", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$products.product", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: shopProductCollectionName,
          let: { pid: { $ifNull: ["$products.product.productId", "000000000000000000000000"] } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$pid" }] }
              }
            }
          ],
          as: "shopProduct"
        }
      },
      { $unwind: { path: "$shopProduct", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: productCollectionName,
          let: { pid: { $ifNull: ["$shopProduct.productId", "000000000000000000000000"] } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$pid" }] }
              }
            }
          ],
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: productCollectionName,
          let: { pid: { $ifNull: ["$products.product.productId", "000000000000000000000000"] } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$pid" }] }
              }
            }
          ],
          as: "directProduct"
        }
      },
      { $unwind: { path: "$directProduct", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          "products.product.productName": { $ifNull: ["$product.Name", "$product.name", "$directProduct.Name", "$directProduct.name"] },
          "products.product.icon": { $ifNull: ["$product.icon", "$directProduct.icon", "$products.product.icon"] }
        }
      },
      {
        $group: {
          _id: {
            _id: "$_id",
            day: "$products.day"
          },
          doc: { $first: "$$ROOT" },
          items: { $push: "$products.product" }
        }
      },
      {
        $project: {
          _id: "$doc._id",
          customerId: "$doc.customerId",
          shopId: "$doc.shopId",
          month: "$doc.month",
          year: "$doc.year",
          totalBill: "$doc.totalBill",
          day: "$_id.day",
          items: {
            $filter: {
              input: "$items",
              as: "item",
              cond: { $ne: ["$$item", null] }
            }
          }
        }
      },
      {
        $group: {
          _id: "$_id",
          customerId: { $first: "$customerId" },
          shopId: { $first: "$shopId" },
          month: { $first: "$month" },
          year: { $first: "$year" },
          totalBill: { $first: "$totalBill" },
          products: {
            $push: {
              day: "$day",
              product: "$items"
            }
          }
        }
      }
    ];

    const cards = await col.aggregate(pipeline).toArray();

    if (!cards.length) {
       return ok(res, { card: null });
    }

    const card = cards[0];
    if (card.products) {
       card.products = card.products.filter(p => p.day != null).sort((a, b) => a.day - b.day);
    }

    ok(res, { card });
  } catch (err) {
    console.error(err);
    serverError(res);
  }
}

