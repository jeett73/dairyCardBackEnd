import Joi from "joi";

export const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
  })
});

export const sendOtpSchema = Joi.object({
  body: Joi.object({
    phone: Joi.string().regex(/^\d{10}$/).required()
  })
});

export const verifyOtpSchema = Joi.object({
  body: Joi.object({
    phone: Joi.string().regex(/^\d{10}$/).required(),
    otp: Joi.string().trim().min(4).max(6).required()
  })
});

export const setMpinSchema = Joi.object({
  body: Joi.object({
    userId: Joi.string().hex().length(24),
    mpin: Joi.string().regex(/^\d{4,6}$/).required()
  })
});

export const verifyMpinSchema = Joi.object({
  body: Joi.object({
    userId: Joi.string().hex().length(24),
    mpin: Joi.string().regex(/^\d{4,6}$/).required()
  })
});
