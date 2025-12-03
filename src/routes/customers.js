import { Router } from "express";
import validate from "../middleware/validate.js";
import { listCustomersSchema, createCustomerSchema } from "../validation/customerSchemas.js";
import { listCustomers, createCustomer } from "../controllers/customerController.js";

const router = Router();

router.get("/", validate(listCustomersSchema), listCustomers);
router.post("/add", validate(createCustomerSchema), createCustomer);

export default router;
