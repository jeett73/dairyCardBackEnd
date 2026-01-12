import { Router } from "express";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/auth.js";
import { createShopSchema, updateShopSchema, updatePlanSchema, updatePasswordSchema, listShopsSchema } from "../validation/shopSchemas.js";
import { registerShop, updateShop, updatePlanActive, updatePassword, listShops } from "../controllers/shopController.js";

const router = Router();

router.get("/", validate(listShopsSchema), listShops);
router.post("/create", validate(createShopSchema), registerShop);
router.put("/:id", validate(updateShopSchema), updateShop);
router.patch("/:id/password", authenticate, validate(updatePasswordSchema), updatePassword);
router.patch("/:id/isPlanActive", validate(updatePlanSchema), updatePlanActive);
router.put("/:id/isPlanActive", validate(updatePlanSchema), updatePlanActive);

export default router;
