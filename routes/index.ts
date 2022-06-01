import express from "express";
import metar from "./METAR";
import icao from "./ICAO";
import health from "./Health";

const router = express.Router();

// Router Middleware
router.use("/METAR", metar);
router.use("/ICAO", icao);
router.use("/health", health);

export default router;
