import { Router } from "express";
import validate from "../middleware/validate.js";
import { listCustomersSchema, createCustomerSchema, getCustomerByIdSchema } from "../validation/customerSchemas.js";
import { listCustomers, createCustomer, getCustomerById } from "../controllers/customerController.js";

const router = Router();

router.get("/", validate(listCustomersSchema), listCustomers);
router.get("/:id", validate(getCustomerByIdSchema), getCustomerById);
router.post("/add", validate(createCustomerSchema), createCustomer);

export default router;
