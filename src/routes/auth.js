import { Router } from "express";
import validate from "../middleware/validate.js";
import { loginSchema, verifyOtpSchema, setMpinSchema, verifyMpinSchema, refreshSchema, logoutSchema } from "../validation/authSchemas.js";
import { login, verifyOtp, setMpin, verifyMpin, refresh, logout } from "../controllers/authController.js";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/set-mpin", validate(setMpinSchema), setMpin);
router.post("/verify-mpin", validate(verifyMpinSchema), verifyMpin);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/logout/:userId", validate(logoutSchema), logout);

export default router;
