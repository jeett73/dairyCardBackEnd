import { ObjectId } from "mongodb";
import { getCollection as getShopCollection } from "../models/shop.js";
import { ok, created, updated, notFound, conflict, serverError, badRequest } from "../utils/response.js";

export async function registerShop(req, res) {
  try {
    const col = getShopCollection();
    const doc = req.body;
    // const existingByPhone = await col.findOne({ phone: doc.phone });
    // if (existingByPhone) {
    //   return conflict(res, "Shop already exists");
    // }
    const name = (doc.shopName || "").toString();
    const normalized = name.replace(/\s+/g, "").toUpperCase();
    if (!normalized) {
      return badRequest(res, "shopName is required");
    }
    const prefix = normalized.slice(0, 4);

    let candidate;
    let result;
    for (let attempt = 0; attempt < 3; attempt++) {
      const last = await col
        .find({ uniqueId: { $regex: `^${prefix}\\d{3}$` } })
        .sort({ uniqueId: -1 })
        .limit(1)
        .toArray();
      const lastNum = last.length ? parseInt(last[0].uniqueId.slice(prefix.length), 10) || 0 : 0;
      const nextNum = lastNum + 1;
      const suffix = String(nextNum).padStart(3, "0");
      candidate = `${prefix}${suffix}`;
      try {
        result = await col.insertOne({ ...doc, uniqueId: candidate });
        break;
      } catch (err) {
        if (err && err.code === 11000) {
          continue;
        }
        throw err;
      }
    }
    if (!result) {
      return conflict(res, "Shop already exists");
    }
    const createdDoc = await col.findOne({ _id: result.insertedId });
    created(res, { shop: createdDoc });
  } catch (err) {
    if (err && err.code === 11000) {
      return conflict(res, "Shop already exists");
    }
    serverError(res);
  }
}

export async function updateShop(req, res) {
  try {
    const col = getShopCollection();
    const id = new ObjectId(req.params.id);
    const update = req.body;
    const result = await col.findOneAndUpdate(
      { _id: id },
      { $set: update },
      { returnDocument: "after" }
    );
    if (!result.value) return notFound(res, "Shop not found");
    updated(res, { shop: result.value });
  } catch {
    serverError(res);
  }
}

export async function updatePlanActive(req, res) {
  try {
    const col = getShopCollection();
    const id = new ObjectId(req.params.id);
    const { isPlanActive } = req.body;
    const result = await col.findOneAndUpdate(
      { _id: id },
      { $set: { isPlanActive } },
      { returnDocument: "after" }
    );
    if (!result.value) return notFound(res, "Shop not found");
    updated(res, { shop: result.value });
  } catch {
    serverError(res);
  }
}

export async function listShops(req, res) {
  try {
    const col = getShopCollection();
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const q = (req.query.q || "").toString().trim();
    const serviceId = (req.query.serviceId || "").toString().trim();

    const filter = { isDeleted: { $ne: true } };
    if (serviceId) {
      filter.serviceId = serviceId;
    }
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { shopName: regex },
        { shopOwnerName: regex },
        { phone: regex },
        { uniqueId: regex },
        { "Address.city": regex },
        { "Address.state": regex },
        { "Address.postalCode": regex }
      ];
    }

    const skip = (page - 1) * limit;
    const total = await col.countDocuments(filter);
    const shops = await col
      .find(filter)
      .sort({ shopName: 1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    ok(res, { shops, page, limit, total });
  } catch {
    serverError(res);
  }
}
