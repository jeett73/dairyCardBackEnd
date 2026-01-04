import Joi from 'joi';

export const addOrderSchema = Joi.object({
  body: Joi.object({
    customerId: Joi.string().hex().length(24).required(),
    shopId: Joi.string().hex().length(24).required(),
    products: Joi.array()
      .items(
        Joi.object({
          day: Joi.number().integer().min(1).max(31).required(),
          product: Joi.array()
            .items(
              Joi.object({
                productId: Joi.string().hex().length(24).required(),
                time: Joi.number().required(),
                qty: Joi.number().integer().min(1).required(),
                price: Joi.number().min(0).required(),
              }),
            )
            .required(),
          others: Joi.array()
            .items(
              Joi.object({
                time: Joi.number().required(),
                price: Joi.number().min(0).required(),
              }),
            )
            .default([]),
        }),
      )
      .min(1)
      .required(),
  }),
});

export const updateOrderSchema = Joi.object({
  body: Joi.object({
    cardId: Joi.string().hex().length(24).required(),
    day: Joi.number().integer().min(1).max(31).required(),
    products: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string().hex().length(24).required(),
          time: Joi.number().required(),
          qty: Joi.number().integer().min(0).required(),
          price: Joi.number().min(0).required(),
        }),
      )
      .required(),
  }),
});

export const getCardDetailsSchema = Joi.object({
  query: Joi.object({
    customerId: Joi.string().hex().length(24).required(),
    shopId: Joi.string().hex().length(24).required(),
  }),
});

export const paymentDoneSchema = Joi.object({
  body: Joi.object({
    customerId: Joi.string().hex().length(24).required(),
    shopId: Joi.string().hex().length(24).required(),
    paymentAmount: Joi.number().min(1).required(),
  }),
});

export const getRecentOrdersSchema = Joi.object({
  query: Joi.object({
    shopId: Joi.string().hex().length(24).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(10),
  }),
});
