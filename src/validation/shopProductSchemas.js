import Joi from "joi";

export const addShopProductSchema = Joi.object({
  body: Joi.object({
    shopId: Joi.string().hex().length(24).required(),
    productId: Joi.string().hex().length(24).required(),
    price: Joi.number().min(0).required()
  })
});

export const updatePriceSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
    price: Joi.number().min(0).required()
  })
});

export const listShopProductsSchema = Joi.object({
  query: Joi.object({
    shopId: Joi.string().hex().length(24).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
});

