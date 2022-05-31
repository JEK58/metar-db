import express from "express";
import metar from "./METAR";
import icao from "./ICAO";

const router = express.Router();

// Router Middleware
router.use("/METAR", metar);
router.use("/ICAO", icao);

export default router;
