import express, { Request, Response } from "express";
import MetarDataModel from "../models/MetarDataModel";
import endOfDay from "date-fns/endOfDay";
import startOfDay from "date-fns/startOfDay";

const router = express.Router();

router.get("/:icao/", async (req: Request, res: Response) => {
  try {
    const response = await MetarDataModel.find({
      ICAO: req.params.icao,
    });

    const foo = response.map((v) => {
      return { QNH: v.qnh, date: v.createdAt };
    });
    res.status(201).send(foo);
  } catch (error) {
    console.error(error);
    res.status(400).json("Error: " + error);
  }
});

router.get("/:icao/:date", async (req: Request, res: Response) => {
  try {
    const response = await MetarDataModel.find({
      ICAO: req.params.icao,
      createdAt: {
        $gte: startOfDay(new Date(req.params.date)),
        $lte: endOfDay(new Date(req.params.date)),
      },
    });

    const foo = response.map((v) => {
      return { QNH: v.qnh, date: v.createdAt };
    });
    res.status(201).send(foo);
  } catch (error) {
    console.error(error);
    res.status(400).json("Error: " + error);
  }
});

export default router;
