import { Router } from "express";
import validate from "../middleware/validate.js";
import { addShopProductSchema, updatePriceSchema, listShopProductsSchema } from "../validation/shopProductSchemas.js";
import { addShopProduct, updateShopProductPrice, listShopProducts } from "../controllers/shopProductController.js";

const router = Router();

router.post("/add", validate(addShopProductSchema), addShopProduct);
router.patch("/:id/price", validate(updatePriceSchema), updateShopProductPrice);
router.get("/", validate(listShopProductsSchema), listShopProducts);

export default router;

