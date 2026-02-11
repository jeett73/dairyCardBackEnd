import { Router } from "express";
import validate from "../middleware/validate.js";
import { addOrderSchema, getCardDetailsSchema, paymentDoneSchema, getRecentOrdersSchema, updateOrderSchema, getCardDetailsByMonthSchema } from "../validation/cardSchemas.js";
import { addOrder, getCardDetails, getBillSummary, getCustomerDueCards, paymentDone, getRecentOrders, updateOrder, getMonthlyDuesAndDetails, getCardDetailsByMonth } from "../controllers/cardController.js";

const router = Router();

router.post("/order", validate(addOrderSchema), addOrder);
router.post("/update-order", validate(updateOrderSchema), updateOrder);
router.post("/payment-done", validate(paymentDoneSchema), paymentDone);
router.get("/recent-orders", validate(getRecentOrdersSchema), getRecentOrders);
router.get("/summary", validate(getCardDetailsSchema), getBillSummary);
router.get("/due-cards", validate(getCardDetailsSchema), getCustomerDueCards);
router.get("/", validate(getCardDetailsSchema), getCardDetails);
router.get("/dues-details", validate(getCardDetailsSchema), getMonthlyDuesAndDetails);
router.post("/monthly-details", validate(getCardDetailsByMonthSchema), getCardDetailsByMonth);

export default router;

