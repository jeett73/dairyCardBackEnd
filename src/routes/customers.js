import { Router } from "express";
import validate from "../middleware/validate.js";
import { listCustomersSchema, createCustomerSchema, getCustomerByIdSchema, updateCustomerSchema, deleteCustomerSchema } from "../validation/customerSchemas.js";
import { listCustomers, createCustomer, getCustomerById, updateCustomer, deleteCustomer } from "../controllers/customerController.js";

const router = Router();

router.get("/", validate(listCustomersSchema), listCustomers);
router.get("/:id", validate(getCustomerByIdSchema), getCustomerById);
router.put("/:id", validate(updateCustomerSchema), updateCustomer);
router.post("/add", validate(createCustomerSchema), createCustomer);
router.delete("/:id", validate(deleteCustomerSchema), deleteCustomer);

export default router;
