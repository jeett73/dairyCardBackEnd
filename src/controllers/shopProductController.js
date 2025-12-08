import { ObjectId } from "mongodb";
import { getCollection as getShopProductCollection } from "../models/shopProduct.js";
import { ok, created, updated, notFound, conflict, serverError } from "../utils/response.js";

export async function addShopProduct(req, res) {
  try {
    const col = getShopProductCollection();
    const shopId = (req.body.shopId || "").toString();
    const productId = (req.body.productId || "").toString();
    const price = Number(req.body.price);
    const existing = await col.findOne({ shopId, productId });
    if (existing) {
      return conflict(res, "Product already added to shop");
    }
    const insertDoc = { shopId : new ObjectId(shopId), productId : new ObjectId(productId), price };
    const result = await col.insertOne(insertDoc);
    const createdDoc = await col.findOne({ _id: result.insertedId });
    created(res, { shopProduct: createdDoc });
  } catch (err) {
    if (err && err.code === 11000) {
      return conflict(res, "Product already added to shop");
    }
    serverError(res);
  }
}

export async function updateShopProductPrice(req, res) {
  try {
    const col = getShopProductCollection();
    const id = new ObjectId(req.params.id);
    const price = Number(req.body.price);
    const result = await col.findOneAndUpdate(
      { _id: id },
      { $set: { price } },
      { returnDocument: "after" }
    );
    if (!result.value) return notFound(res, "Shop product not found");
    updated(res, { shopProduct: result.value });
  } catch {
    serverError(res);
  }
}

export async function listShopProducts(req, res) {
  try {
    const col = getShopProductCollection();
    const shopId = (req.query.shopId || "").toString();
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const filter = { shopId: new ObjectId(shopId) };
    const skip = (page - 1) * limit;
    const total = await col.countDocuments(filter);
    const items = await col
      .aggregate([
        { $match: filter },
        { $sort: { _id: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product"
          }
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        { $addFields: { productName: { $ifNull: ["$product.Name", "$product.name"] } } },
        { $project: { product: 0, productObjectId: 0 } }
      ])
      .toArray();
    ok(res, { shopProducts: items, page, limit, total });
  } catch {
    serverError(res);
  }
}
