import { Router } from "express";
import validate from "../middleware/validate.js";
import { addOrderSchema, getCardDetailsSchema } from "../validation/cardSchemas.js";
import { addOrder, getCardDetails } from "../controllers/cardController.js";

const router = Router();

router.post("/order", validate(addOrderSchema), addOrder);
router.get("/", validate(getCardDetailsSchema), getCardDetails);

export default router;

