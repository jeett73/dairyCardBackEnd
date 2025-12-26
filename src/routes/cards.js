import { Router } from "express";
import validate from "../middleware/validate.js";
import { addOrderSchema, getCardDetailsSchema } from "../validation/cardSchemas.js";
import { addOrder, getCardDetails, getBillSummary } from "../controllers/cardController.js";

const router = Router();

router.post("/order", validate(addOrderSchema), addOrder);
router.get("/summary", validate(getCardDetailsSchema), getBillSummary);
router.get("/", validate(getCardDetailsSchema), getCardDetails);

export default router;

