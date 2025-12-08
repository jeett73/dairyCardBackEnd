import { ObjectId } from "mongodb";
import { findUserByEmail } from "../db/mockUserStore.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { getCollection as getCustomerCollection } from "../models/customer.js";
import { getCollection as getShopCollection } from "../models/shop.js";
import { ok, updated, notFound, badRequest, serverError } from "../utils/response.js";

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });
  const token = signAccessToken({ sub: user.id, email: user.email });
  res.status(200).json({ token });
}

export async function profile(req, res) {
  res.status(200).json({ user: { id: req.user.sub, email: req.user.email } });
}

export async function sendOtp(req, res) {
  const phone = (req.body.phone || "").toString();
  const customers = getCustomerCollection();
  const customer = await customers.findOne({ phone });
  if (customer) return res.status(200).json({ message: "OTP sent" });
  const shops = getShopCollection();
  const shop = await shops.findOne({ phone });
  if (shop) return res.status(200).json({ message: "OTP sent" });
  return res.status(404).json({ message: "User not found" });
}

export async function verifyOtp(req, res) {
  const phone = (req.body.phone || "").toString();
  const _otp = (req.body.otp || "").toString();
  const customers = getCustomerCollection();
  const customer = await customers.findOne({ phone });
  if (customer) {
    const payload = { sub: customer._id.toString(), phone };
    const token = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await customers.updateOne({ _id: customer._id }, { $set: { refreshToken } });
    return res.status(200).json({ token, refreshToken, userId: customer._id.toString(), entityType: "customer", isMpinAlreadySet: customer?.mpinHash || null });
  }

  const shops = getShopCollection();
  const shop = await shops.findOne({ phone });
  if (shop) {
    const payload = { sub: shop._id.toString(), phone };
    const token = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await shops.updateOne({ _id: shop._id }, { $set: { refreshToken } });
    return res.status(200).json({ token, refreshToken, userId: shop._id.toString(), entityType: "shop", isMpinAlreadySet: shop?.mpinHash || null });
  }

  return res.status(404).json({ message: "User not found" });
}

export async function setMpin(req, res) {
  try {
    const rawId = (req.body.userId || "").toString();
    const mpin = (req.body.mpin || "").toString();

    const id = new ObjectId(rawId);

    const customers = getCustomerCollection();
    let entity = await customers.findOne({ _id: id });
    let collection = customers;
    let entityType = "Customer";

    if (!entity) {
      const shops = getShopCollection();
      const shop = await shops.findOne({ _id: id });
      if (shop) {
        entity = shop;
        collection = shops;
        entityType = "Shop";
      }
    }

    if (!entity) return notFound(res, "User not found");

    const mpinHash = await hashPassword(mpin);
    const result = await collection.findOneAndUpdate(
      { _id: id },
      { $set: { mpinHash } },
      { returnDocument: "after" }
    );
    updated(res, { message: "MPIN set", type: entityType });
  } catch (err) {
    serverError(res);
  }
}

export async function verifyMpin(req, res) {
  try {
    const rawId = (req.body.userId || "").toString();
    const mpin = (req.body.mpin || "").toString();

    const id = new ObjectId(rawId);

    const customers = getCustomerCollection();
    const customer = await customers.findOne({ _id: id });

    if (customer) {
      const hash = customer.mpinHash || "";
      if (!hash) return badRequest(res, "MPIN not set");
      const valid = await verifyPassword(hash, mpin);
      if (!valid) return res.status(401).json({ message: "Invalid MPIN" });
      const payload = { sub: customer._id.toString(), phone: customer.phone };
      const token = signAccessToken(payload);
      return ok(res, { token, entityType: "customer", userId: customer._id.toString() });
    }

    const shops = getShopCollection();
    const shop = await shops.findOne({ _id: id });
    if (!shop) return notFound(res, "User not found");
    const hash = shop.mpinHash || "";
    if (!hash) return badRequest(res, "MPIN not set");
    const valid = await verifyPassword(hash, mpin);
    if (!valid) return res.status(401).json({ message: "Invalid MPIN" });
    const payload = { sub: shop._id.toString(), phone: shop.phone };
    const token = signAccessToken(payload);
    ok(res, { token, entityType: "shop", userId: shop._id.toString() });
  } catch {
    serverError(res);
  }
}

export async function refresh(req, res) {
  try {
    const token = (req.body.refreshToken || "").toString();
    const payload = verifyRefreshToken(token);
    const id = new ObjectId((payload.sub || "").toString());
    const customers = getCustomerCollection();
    let entity = await customers.findOne({ _id: id });
    let collection = customers;
    if (!entity) {
      const shops = getShopCollection();
      const shop = await shops.findOne({ _id: id });
      if (!shop) return notFound(res, "User not found");
      entity = shop;
      collection = shops;
    }
    const stored = (entity.refreshToken || "").toString();
    if (!stored || stored !== token) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const newAccessToken = signAccessToken({ sub: entity._id.toString(), phone: entity.phone });
    ok(res, { token: newAccessToken });
  } catch {
    res.status(401).json({ message: "Invalid refresh token" });
  }
}
