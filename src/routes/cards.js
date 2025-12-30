import { Router } from "express";
import validate from "../middleware/validate.js";
import { addOrderSchema, getCardDetailsSchema, paymentDoneSchema } from "../validation/cardSchemas.js";
import { addOrder, getCardDetails, getBillSummary, getCustomerDueCards, paymentDone } from "../controllers/cardController.js";

const router = Router();

router.post("/order", validate(addOrderSchema), addOrder);
router.post("/payment-done", validate(paymentDoneSchema), paymentDone);
router.get("/summary", validate(getCardDetailsSchema), getBillSummary);
router.get("/due-cards", validate(getCardDetailsSchema), getCustomerDueCards);
router.get("/", validate(getCardDetailsSchema), getCardDetails);

export default router;

