import { ObjectId } from 'mongodb';
import { getCollection as getCardCollection } from '../models/card.js';
import { getCollection as getCustomerCollection } from '../models/customer.js';
import { collectionName as shopProductCollectionName } from '../models/shopProduct.js';
import { collectionName as productCollectionName } from '../models/product.js';
import { ok, serverError } from '../utils/response.js';
import { sendPushNotificationsAsync } from '../services/expoNotification.js';

export async function addOrder(req, res) {
  try {
    const col = getCardCollection();
    const customerId = (req.body.customerId || '').toString();
    const shopId = (req.body.shopId || '').toString();
    const products = Array.isArray(req.body.products) ? req.body.products : [];

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let card = await col.findOne({
      customerId: new ObjectId(customerId),
      shopId: new ObjectId(shopId),
      month,
      year,
    });
    if (!card) {
      const insertDoc = {
        customerId: new ObjectId(customerId),
        shopId: new ObjectId(shopId),
        month,
        year,
        products: [],
        totalBill: 0,
      };
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
      const newProducts = entry.product || [];
      const newOthers = entry.others || [];

      if (existing) {
        if (existing.product) existing.product.push(...newProducts);
        else existing.product = [...newProducts];

        if (existing.others) existing.others.push(...newOthers);
        else existing.others = [...newOthers];
      } else {
        dayMap.set(entry.day, {
          day: entry.day,
          product: [...newProducts],
          others: [...newOthers],
        });
      }
    }
    const merged = Array.from(dayMap.values()).sort((a, b) => a.day - b.day);

    let delta = 0;
    for (const e of additions) {
      if (e.product) {
        for (const p of e.product) {
          delta += Number(p.qty) * Number(p.price);
        }
      }
      if (e.others) {
        for (const o of e.others) {
          delta += Number(o.price);
        }
      }
    }

    const totalBill = Number(card.totalBill || 0) + delta;

    const updated = await col.findOneAndUpdate(
      { _id: card._id },
      { $set: { products: merged, totalBill } },
      { returnDocument: 'after' },
    );

    const customers = getCustomerCollection();
    const customer = await customers.findOne({ _id: new ObjectId(customerId) });
    if (customer && customer.fcmToken) {
      let tokens = [];
      if (Array.isArray(customer.fcmToken)) {
        tokens = customer.fcmToken.map(t => t.fcmToken).filter(t => t);
      } else if (typeof customer.fcmToken === 'string') {
        tokens = [customer.fcmToken];
      }

      if (tokens.length > 0) {
        await sendPushNotificationsAsync(tokens, 'Order Update', 'Order Done');
      }
    }

    ok(res, { card: updated.value });
  } catch (error) {
    console.error(error);
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
          year: year,
        },
      },
      { $unwind: { path: '$products', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$products.product', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: shopProductCollectionName,
          let: { pid: { $ifNull: ['$products.product.productId', '000000000000000000000000'] } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', { $toObjectId: '$$pid' }] },
              },
            },
          ],
          as: 'shopProduct',
        },
      },
      { $unwind: { path: '$shopProduct', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: productCollectionName,
          let: { pid: { $ifNull: ['$shopProduct.productId', '000000000000000000000000'] } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', { $toObjectId: '$$pid' }] },
              },
            },
          ],
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: productCollectionName,
          let: { pid: { $ifNull: ['$products.product.productId', '000000000000000000000000'] } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', { $toObjectId: '$$pid' }] },
              },
            },
          ],
          as: 'directProduct',
        },
      },
      { $unwind: { path: '$directProduct', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          'products.product.productName': {
            $ifNull: [
              '$product.Name',
              '$product.name',
              '$directProduct.Name',
              '$directProduct.name',
            ],
          },
          'products.product.icon': {
            $ifNull: ['$product.icon', '$directProduct.icon', '$products.product.icon'],
          },
        },
      },
      {
        $group: {
          _id: {
            _id: '$_id',
            day: '$products.day',
          },
          doc: { $first: '$$ROOT' },
          items: { $push: '$products.product' },
          others: { $first: '$products.others' },
        },
      },
      {
        $project: {
          _id: '$doc._id',
          customerId: '$doc.customerId',
          shopId: '$doc.shopId',
          month: '$doc.month',
          year: '$doc.year',
          totalBill: '$doc.totalBill',
          day: { $toInt: '$_id.day' },
          others: '$others',
          items: {
            $filter: {
              input: '$items',
              as: 'item',
              cond: { $ne: ['$$item', null] },
            },
          },
        },
      },
      { $sort: { day: -1 } },
      {
        $group: {
          _id: '$_id',
          customerId: { $first: '$customerId' },
          shopId: { $first: '$shopId' },
          month: { $first: '$month' },
          year: { $first: '$year' },
          totalBill: { $first: '$totalBill' },
          products: {
            $push: {
              day: '$day',
              product: '$items',
              others: '$others',
            },
          },
        },
      },
    ];

    const cards = await col.aggregate(pipeline).toArray();

    if (!cards.length) {
      return ok(res, { card: null });
    }

    const card = cards[0];
    if (card.products) {
      card.products = card.products.filter((p) => p.day != null).sort((a, b) => b.day - a.day);
    }

    ok(res, { card });
  } catch (err) {
    console.error(err);
    serverError(res);
  }
}

export async function getCustomerDueCards(req, res) {
  try {
    const col = getCardCollection();
    const { customerId, shopId } = req.query;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const pipeline = [
      {
        $match: {
          customerId: new ObjectId(customerId),
          shopId: new ObjectId(shopId),
          $or: [
            { year: { $lt: currentYear } },
            { year: currentYear, month: { $lt: currentMonth } },
          ],
        },
      },
      {
        $addFields: {
          totalBillVal: { $ifNull: ['$totalBill', 0] },
          receivedAmountVal: { $ifNull: ['$receivedAmount', 0] },
        },
      },
      {
        $addFields: {
          dueAmount: { $subtract: ['$totalBillVal', '$receivedAmountVal'] },
        },
      },
      {
        $match: {
          dueAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          _id: 0,
          month: 1,
          year: 1,
          dueAmount: 1,
        },
      },
    ];

    const dues = await col.aggregate(pipeline).toArray();

    ok(res, { dues });
  } catch (err) {
    console.error(err);
    serverError(res);
  }
}

export async function getBillSummary(req, res) {
  try {
    const col = getCardCollection();
    const { customerId, shopId } = req.query;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const card = await col
      .find(
        {
          customerId: new ObjectId(customerId),
          shopId: new ObjectId(shopId),
          $or: [
            { year: { $lt: currentYear } },
            { year: currentYear, month: { $lt: currentMonth } },
          ],
        },
        { projection: { totalBill: 1, month: 1, year: 1, _id: 0 } },
      )
      .toArray();

    ok(res, card);
  } catch (err) {
    console.error(err);
    serverError(res);
  }
}

export async function paymentDone(req, res) {
  try {
    const col = getCardCollection();
    const { customerId, shopId, paymentAmount } = req.body;
    let remainingPayment = Number(paymentAmount);

    const cards = await col
      .find({
        customerId: new ObjectId(customerId),
        shopId: new ObjectId(shopId),
      })
      .sort({ year: 1, month: 1 })
      .toArray();

    if (cards.length === 0) {
      return ok(res, { message: 'No cards found for this customer' });
    }

    const updates = [];

    for (const card of cards) {
      if (remainingPayment <= 0) break;

      const totalBill = Number(card.totalBill || 0);
      const receivedAmount = Number(card.receivedAmount || 0);
      const pending = totalBill - receivedAmount;

      if (pending > 0) {
        const toPay = Math.min(pending, remainingPayment);
        const newReceived = receivedAmount + toPay;
        remainingPayment -= toPay;

        // Update local object to track latest state
        card.receivedAmount = newReceived;

        updates.push({
          updateOne: {
            filter: { _id: card._id },
            update: { $set: { receivedAmount: newReceived } },
          },
        });
      }
    }

    // If there is still remaining payment, add it to the last card (latest month)
    if (remainingPayment > 0) {
      const lastCard = cards[cards.length - 1];
      const existingUpdateIndex = updates.findIndex(
        (u) => u.updateOne.filter._id.toString() === lastCard._id.toString(),
      );

      let newReceived = Number(lastCard.receivedAmount || 0) + remainingPayment;

      if (existingUpdateIndex !== -1) {
        updates[existingUpdateIndex].updateOne.update.$set.receivedAmount = newReceived;
      } else {
        updates.push({
          updateOne: {
            filter: { _id: lastCard._id },
            update: { $set: { receivedAmount: newReceived } },
          },
        });
      }
      remainingPayment = 0;
    }

    if (updates.length > 0) {
      await col.bulkWrite(updates);
    }

    ok(res, { message: 'Payment processed successfully' });
  } catch (err) {
    console.error(err);
    serverError(res);
  }
}

export async function getRecentOrders(req, res) {
  try {
    const col = getCardCollection();
    const { shopId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const today = new Date().getDate();

    const pipeline = [
      {
        $match: {
          shopId: new ObjectId(shopId),
          'products.day': today,
        },
      },
      { $sort: { modifiedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "customers",
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          customerId: 1,
          shopId: 1,
          month: 1,
          year: 1,
          totalBill: 1,
          receivedAmount: 1,
          modifiedAt: 1,
          products: {
            $filter: {
              input: '$products',
              as: 'item',
              cond: { $eq: ['$$item.day', today] },
            },
          },
          customerName: '$customer.name',
          cardNumber: '$customer.cardNumber',
          phone: '$customer.phone',
        },
      },
    ];

    const orders = await col.aggregate(pipeline).toArray();

    ok(res, { orders, page, limit });
  } catch (err) {
    console.error(err);
    serverError(res);
  }
}

export async function updateOrder(req, res) {
  try {
    const col = getCardCollection();
    const { cardId, day, products, others } = req.body;

    const card = await col.findOne({ _id: new ObjectId(cardId) });
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const othersList = others || [];

    // Calculate total for new products
    let newDayTotal = 0;
    for (const p of products) {
      newDayTotal += Number(p.qty) * Number(p.price);
    }
    for (const o of othersList) {
      newDayTotal += Number(o.price);
    }

    // Find existing products for the day and calculate old total
    let oldDayTotal = 0;
    const existingDayEntry = card.products.find((p) => p.day === day);
    if (existingDayEntry) {
      if (existingDayEntry.product) {
        for (const p of existingDayEntry.product) {
          oldDayTotal += Number(p.qty) * Number(p.price);
        }
      }
      if (existingDayEntry.others) {
        for (const o of existingDayEntry.others) {
          oldDayTotal += Number(o.price);
        }
      }
    }

    // Calculate difference
    const diff = newDayTotal - oldDayTotal;
    const newTotalBill = (card.totalBill || 0) + diff;

    // Update products array
    let updatedProducts = card.products.filter((p) => p.day !== day);
    if (products.length > 0 || othersList.length > 0) {
      updatedProducts.push({ day, product: products, others: othersList });
    }
    updatedProducts.sort((a, b) => a.day - b.day);

    const updated = await col.findOneAndUpdate(
      { _id: card._id },
      {
        $set: {
          products: updatedProducts,
          totalBill: newTotalBill,
          modifiedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    ok(res, { message: 'Order updated successfully' }, { card: updated.value });
  } catch (err) {
    console.error(err);
    serverError(res);
  }
}
