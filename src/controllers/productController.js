import { getCollection as getProductCollection } from "../models/product.js";
import { ok, created, serverError, badRequest } from "../utils/response.js";

export async function createProduct(req, res) {
  try {
    const Name = (req.body.name || "").toString().trim();
    if (!Name) {
      return badRequest(res, "Name is required");
    }
    const iconPath = req.file ? `/uploads/products/${req.file.filename}` : "";
    const col = getProductCollection();
    const insertDoc = { isDeleted: false, Name, icon: iconPath };
    const result = await col.insertOne(insertDoc);
    const createdDoc = await col.findOne({ _id: result.insertedId });
    created(res, { product: createdDoc });
  } catch {
    console.log(res);
    serverError(res);
  }
}

export async function listProducts(req, res) {
  try {
    const col = getProductCollection();
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const q = (req.query.q || "").toString().trim();

    const filter = { isDeleted: { $ne: true } };
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ Name: regex }];
    }

    const skip = (page - 1) * limit;
    const total = await col.countDocuments(filter);
    const products = await col
      .find(filter)
      .sort({ Name: 1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    ok(res, { products, page, limit, total });
  } catch {
    serverError(res);
  }
}
