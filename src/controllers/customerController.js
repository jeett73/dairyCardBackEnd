import { getCollection as getCustomerCollection } from '../models/customer.js';
import { collectionName as shopCollectionName } from '../models/shop.js';
import { collectionName as cardCollectionName } from '../models/card.js';
import { ok, created, updated, conflict, serverError, notFound, badRequest } from '../utils/response.js';
import { ObjectId } from 'mongodb';
import { getISTTime } from '../utils/dateUtils.js';

export async function listCustomers(req, res) {
  try {
    const col = getCustomerCollection();
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const shopId = (req.query.shopId || '').toString();
    const q = (req.query.q || '').toString().trim();

    const filter = { isDeleted: { $ne: true }, shopId: new ObjectId(shopId) };
    if (q) {
      if (/[a-zA-Z]/.test(q)) {
        filter.name = { $regex: q, $options: 'i' };
      } else if (q.length <= 3) {
        filter.cardNumber = q.toString();
      } else {
        filter.phone = q.toString();
      }
    }

    const { month, year } = getISTTime();
    const prevMonthsCriteria = [];
    for (let i = 1; i <= 5; i++) {
      let targetMonth = month - i;
      let targetYear = year;
      while (targetMonth < 1) {
        targetMonth += 12;
        targetYear -= 1;
      }
      prevMonthsCriteria.push({
        $and: [{ $eq: ['$month', targetMonth] }, { $eq: ['$year', targetYear] }],
      });
    }

    const skip = (page - 1) * limit;
    const total = await col.countDocuments(filter);
    const customers = await col
      .aggregate([
        { $match: filter },
        {
          $addFields: {
            cardNumberNum: { $toLong: "$cardNumber" }
          }
        },
        {
          $sort: { cardNumberNum: 1 } // 1 = ascending, -1 = descending
        },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: shopCollectionName,
            let: { shopIdStr: '$shopId' },
            pipeline: [
              { $match: { $expr: { $eq: ['$_id', '$$shopIdStr'] } } },
              { $project: { shopName: 1, phone: 1, Address: 1, isPlanActive: 1 } },
            ],
            as: 'shop',
          },
        },
        { $addFields: { shop: { $arrayElemAt: ['$shop', 0] } } },
        {
          $lookup: {
            from: cardCollectionName,
            let: { customerId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$customerId', '$$customerId'] },
                      {
                        $or: prevMonthsCriteria,
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  due: {
                    $subtract: [
                      { $ifNull: ['$totalBill', 0] },
                      { $ifNull: ['$receivedAmount', 0] },
                    ],
                  },
                },
              },
            ],
            as: 'prevCards',
          },
        },
        {
          $addFields: {
            previousMonthDue: { $sum: '$prevCards.due' },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            cardNumber: 1,
            phone: 1,
            regularProduct: 1,
            previousMonthDue: 1,
          },
        },
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
    const phone = (doc.phone || '').toString();
    const cardNumber = (doc.cardNumber || '').toString();

    const existing = await col.findOne({
      shopId,
      $or: cardNumber ? [{ phone }, { cardNumber }] : [{ phone }]
    });

    if (existing) {
      if (existing.phone === phone) {
        return conflict(res, 'A card with this phone number already exists.');
      }
      return conflict(res, 'Card Number already exists');
    }

    const insertDoc = { ...doc, isDeleted: false, shopId };
    const result = await col.insertOne(insertDoc);
    const createdDoc = await col.findOne({ _id: result.insertedId });
    created(res, { customer: createdDoc });
  } catch (err) {
    if (err && err.code === 11000) {
      return conflict(res, 'Card Number already exists');
    }
    serverError(res);
  }
}

export async function getCustomerById(req, res) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return badRequest(res, 'Invalid customer ID');
    }
    const col = getCustomerCollection();
    const customer = await col.findOne({ _id: new ObjectId(id), isDeleted: { $ne: true } });
    if (!customer) {
      return notFound(res, 'Customer not found');
    }
    ok(res, { customer });
  } catch (err) {
    serverError(res);
  }
}

export async function updateCustomer(req, res) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return badRequest(res, 'Invalid customer ID');
    }
    
    const col = getCustomerCollection();
    const { name, cardNumber, street1, regularProduct, phone } = req.body;

    const currentCustomer = await col.findOne({ _id: new ObjectId(id), isDeleted: { $ne: true } });
    if (!currentCustomer) {
      return notFound(res, 'Customer not found');
    }
    const shopId = currentCustomer.shopId;

    const conflictOr = [];
    if (phone !== undefined && phone !== currentCustomer.phone) {
      conflictOr.push({ phone });
    }
    if (cardNumber !== undefined && cardNumber !== currentCustomer.cardNumber) {
      conflictOr.push({ cardNumber });
    }

    if (conflictOr.length > 0) {
      const existing = await col.findOne({
        shopId,
        _id: { $ne: new ObjectId(id) },
        $or: conflictOr,
      });

      if (existing) {
        if (phone !== undefined && existing.phone === phone) {
          return conflict(res, 'With this Phone number Card already exists');
        }
        return conflict(res, 'cardNumber already exists');
      }
    }
    
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (cardNumber !== undefined) updateFields.cardNumber = cardNumber;
    if (street1 !== undefined) updateFields['address.street1'] = street1;
    if (regularProduct !== undefined) updateFields.regularProduct = regularProduct;
    if (phone !== undefined) updateFields.phone = phone;

    if (Object.keys(updateFields).length === 0) {
      return badRequest(res, 'No fields to update');
    }

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    // result will not be null because we checked existence earlier
    updated(res, { customer: result });
  } catch (err) {
    if (err && err.code === 11000) {
      return conflict(res, 'Card number already exists');
    }
    serverError(res);
  }
}
