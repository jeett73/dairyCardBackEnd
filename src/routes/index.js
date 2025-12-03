import authRouter from "./auth.js";
import shopsRouter from "./shops.js";
import customersRouter from "./customers.js";
import cardsRouter from "./cards.js";
import productsRouter from "./products.js";

export default function routes(app) {
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });
  app.use("/auth", authRouter);
  app.use("/shops", shopsRouter);
  app.use("/products", productsRouter);
  app.use("/customers", customersRouter);
  app.use("/cards", cardsRouter);
}
