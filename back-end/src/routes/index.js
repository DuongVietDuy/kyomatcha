const express = require("express");
const router = express.Router();

const cartRoutes = require("../routes/cartRoutes");
const orderRoutes = require("../routes/orderRoutes");
const authRouter = require('../routes/authRoutes');
const productRouter = require('../routes/product');
const paymentRouter = require('../routes/paymentRoutes');

router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/api", authRouter); // /auth
router.use('/api', productRouter);
router.use('/vietqr', paymentRouter);

module.exports = router;