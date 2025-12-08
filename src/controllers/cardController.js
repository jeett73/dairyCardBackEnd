import { ObjectId } from "mongodb";
import { getCollection as getCardCollection } from "../models/card.js";
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

    let card = await col.findOne({ customerId, shopId, month, year });
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

