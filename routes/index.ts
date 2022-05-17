import express from "express";
import qnh from "./QNH";
import icao from "./ICAO";

const router = express.Router();

// Router Middleware
router.use("/QNH", qnh);
router.use("/ICAO", icao);

export default router;
