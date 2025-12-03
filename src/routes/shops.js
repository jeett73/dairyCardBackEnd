import { Router } from "express";
import validate from "../middleware/validate.js";
import { createShopSchema, updateShopSchema, updatePlanSchema, listShopsSchema } from "../validation/shopSchemas.js";
import { registerShop, updateShop, updatePlanActive, listShops } from "../controllers/shopController.js";

const router = Router();

router.get("/", validate(listShopsSchema), listShops);
router.post("/create", validate(createShopSchema), registerShop);
router.put("/:id", validate(updateShopSchema), updateShop);
router.patch("/:id/isPlanActive", validate(updatePlanSchema), updatePlanActive);
router.put("/:id/isPlanActive", validate(updatePlanSchema), updatePlanActive);

export default router;
