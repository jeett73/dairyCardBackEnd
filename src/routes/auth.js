import { Router } from "express";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/auth.js";
import { loginSchema, sendOtpSchema, verifyOtpSchema, setMpinSchema, verifyMpinSchema, refreshSchema, logoutSchema } from "../validation/authSchemas.js";
import { login, profile, sendOtp, verifyOtp, setMpin, verifyMpin, refresh, logout } from "../controllers/authController.js";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.post("/send-otp", validate(sendOtpSchema), sendOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/set-mpin", validate(setMpinSchema), setMpin);
router.post("/verify-mpin", validate(verifyMpinSchema), verifyMpin);
router.get("/profile", authenticate, profile);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/logout/:userId", validate(logoutSchema), logout);

export default router;
