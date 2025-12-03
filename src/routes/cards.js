import { Router } from "express";
import validate from "../middleware/validate.js";
import { addOrderSchema } from "../validation/cardSchemas.js";
import { addOrder } from "../controllers/cardController.js";

const router = Router();

router.post("/order", validate(addOrderSchema), addOrder);

export default router;

