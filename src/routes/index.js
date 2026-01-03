import authRouter from "./auth.js";
import shopsRouter from "./shops.js";
import customersRouter from "./customers.js";
import cardsRouter from "./cards.js";
import productsRouter from "./products.js";
import authenticate from "../middleware/auth.js";
import shopProductsRouter from "./shopProducts.js";

export default function routes(app) {
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });
  app.use("/auth", authRouter);
  app.use("/shops", authenticate, shopsRouter);
  app.use("/products", authenticate, productsRouter);
  app.use("/shop-products", authenticate, shopProductsRouter);
  app.use("/customers", authenticate, customersRouter);
  app.use("/cards", authenticate, cardsRouter);
}
