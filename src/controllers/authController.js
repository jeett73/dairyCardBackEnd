import { ObjectId } from "mongodb";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { getCollection as getCustomerCollection } from "../models/customer.js";
import { getCollection as getShopCollection } from "../models/shop.js";
import { ok, updated, notFound, badRequest, serverError } from "../utils/response.js";

export async function login(req, res) {
  const phone = (req.body.phone || "").toString();
  const password = (req.body.password || "").toString();
  const fcmToken = req.body.fcmToken;
  const deviceId = req.body.deviceId;
  
  const customers = getCustomerCollection();
  const customer = await customers.findOne({ phone, cardNumber: password });
  if (customer) {
    if (customer.refreshToken && customer.refreshToken.length > 0) {
      return res.status(400).json({ message: "User already loggedin one device" });
    }
    
    const payload = { sub: customer._id.toString(), phone };
    const token = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    
    const pullUpdate = {
      $pull: { refreshToken: { deviceId } }
    };

    if (Array.isArray(customer.fcmToken)) {
      pullUpdate.$pull.fcmToken = { deviceId };
    }

    await customers.updateOne(
      { _id: customer._id }, 
      pullUpdate
    );
    
    const updateOps = {
      $push: { refreshToken: { refreshToken, deviceId } }
    };

    if (fcmToken) {
      if (customer.fcmToken && !Array.isArray(customer.fcmToken)) {
        updateOps.$set = { fcmToken: [{ fcmToken, deviceId }] };
      } else {
        updateOps.$push.fcmToken = { fcmToken, deviceId };
      }
    }
    
    await customers.updateOne({ _id: customer._id }, updateOps);
    
    return res.status(200).json({ 
      token, 
      refreshToken, 
      userId: customer._id.toString(), 
      entityType: "customer", 
      isMpinAlreadySet: customer?.mpinHash || null, 
      shopId: customer.shopId.toString(), 
      userDetails: {
        name: customer.name,
        cardNumber: customer.cardNumber,
      } 
    });
  }
  
  const shops = getShopCollection();
  const shop = await shops.findOne({ phone });
  
  let isShopValid = false;
  if (shop) {
    if (shop.password && shop.password.startsWith('$argon2')) {
      isShopValid = await verifyPassword(shop.password, password);
    } else {
      isShopValid = shop.password === password;
      if (isShopValid) {
        await shops.updateOne({ _id: shop._id }, { $set: { password: await hashPassword(password) } });
      }
    }
  }

  if (isShopValid) {
    const payload = { sub: shop._id.toString(), phone };
    const token = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    
    await shops.updateOne(
      { _id: shop._id }, 
      { 
        $pull: { 
          refreshToken: { deviceId }
        } 
      }
    );

    const updateOps = {
      $push: { refreshToken: { refreshToken, deviceId } }
    };

    await shops.updateOne({ _id: shop._id }, updateOps);

    return res.status(200).json({ 
      token, 
      refreshToken, 
      userId: shop._id.toString(), 
      entityType: "shop", 
      isMpinAlreadySet: shop?.mpinHash || null, 
      userDetails: {
        name: shop.shopName,
      } 
    });
  }
  
  return res.status(404).json({ message: "User not found" });
}

export async function verifyOtp(req, res) {
  const phone = (req.body.phone || "").toString();
  const _otp = (req.body.otp || "").toString();
  const fcmToken = req.body.fcmToken;
  const deviceId = req.body.deviceId;
  const customers = getCustomerCollection();
  const customer = await customers.findOne({ phone });
  if (customer) {
    const payload = { sub: customer._id.toString(), phone };
    const token = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    
    const pullUpdate = {
      $pull: { refreshToken: { deviceId } }
    };

    if (Array.isArray(customer.fcmToken)) {
      pullUpdate.$pull.fcmToken = { deviceId };
    }

    await customers.updateOne(
      { _id: customer._id }, 
      pullUpdate
    );
    
    const updateOps = {
      $push: { refreshToken: { refreshToken, deviceId } }
    };

    if (fcmToken) {
      if (customer.fcmToken && !Array.isArray(customer.fcmToken)) {
        updateOps.$set = { fcmToken: [{ fcmToken, deviceId }] };
      } else {
        updateOps.$push.fcmToken = { fcmToken, deviceId };
      }
    }
    
    await customers.updateOne({ _id: customer._id }, updateOps);
    return res.status(200).json({ token, refreshToken, userId: customer._id.toString(), entityType: "customer", isMpinAlreadySet: customer?.mpinHash || null, shopId: customer.shopId.toString(), userDetails: {
      name: customer.name,
      cardNumber: customer.cardNumber,
    } });
  }

  const shops = getShopCollection();
  const shop = await shops.findOne({ phone });
  if (shop) {
    const payload = { sub: shop._id.toString(), phone };
    const token = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    
    await shops.updateOne(
      { _id: shop._id }, 
      { 
        $pull: { 
          refreshToken: { deviceId }
        } 
      }
    );

    const updateOps = {
      $push: { refreshToken: { refreshToken, deviceId } }
    };

    await shops.updateOne({ _id: shop._id }, updateOps);

    return res.status(200).json({ token, refreshToken, userId: shop._id.toString(), entityType: "shop", isMpinAlreadySet: shop?.mpinHash || null, userDetails: {
      name: shop.shopName,
    } });
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
    const deviceId = (req.body.deviceId || "").toString();
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
    const tokens = entity.refreshToken || [];
    let stored = null;
    if (Array.isArray(tokens)) {
      const found = tokens.find(t => t.deviceId === deviceId && t.refreshToken === token);
      if (found) stored = found.refreshToken;
    } else if (typeof tokens === 'string') {
      if (tokens === token) stored = token;
    }
    
    if (!stored) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const newAccessToken = signAccessToken({ sub: entity._id.toString(), phone: entity.phone });
    ok(res, { token: newAccessToken });
  } catch {
    res.status(401).json({ message: "Invalid refresh token" });
  }
}

export async function logout(req, res) {
  try {
    const rawId = (req.params.userId || "").toString();
    const deviceId = (req.body.deviceId || "").toString();
    const id = new ObjectId(rawId);
    const customers = getCustomerCollection();
    const customer = await customers.findOne({ _id: id });
    if (customer) {
      const pullOps = { 
        $pull: { 
          refreshToken: { deviceId }
        } 
      };
      if (Array.isArray(customer.fcmToken)) {
        pullOps.$pull.fcmToken = { deviceId };
      }
      await customers.updateOne(
        { _id: id }, 
        pullOps
      );
      return updated(res, { message: "Logged out", entityType: "customer" });
    }
    const shops = getShopCollection();
    const shop = await shops.findOne({ _id: id });
    if (shop) {
      const pullOps = { 
        $pull: { 
          refreshToken: { deviceId }
        } 
      };
      await shops.updateOne(
        { _id: id }, 
        pullOps
      );
      return updated(res, { message: "Logged out", entityType: "shop" });
    }
    return notFound(res, "User not found");
  } catch {
    serverError(res);
  }
}
