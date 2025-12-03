import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import validate from "../middleware/validate.js";
import { createProductSchema, listProductsSchema } from "../validation/productSchemas.js";
import { createProduct, listProducts } from "../controllers/productController.js";

const router = Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.resolve("uploads/products");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "");
    cb(null, `${Date.now()}_${base || "image"}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  if ((file.mimetype || "").startsWith("image/")) return cb(null, true);
  cb(new Error("Invalid file type"));
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/add", upload.single("icon"), validate(createProductSchema), createProduct);
router.get("/", validate(listProductsSchema), listProducts);

export default router;
