import express, { type Request, Response } from "express";
import MetarDataModel from "../models/MetarDataModel";
import IcaoDataModel from "../models/IcaoDataModel";
import { endOfDay } from "date-fns";
import { protectRoute } from "../middleware/ProtectRoute";
// @ts-expect-error
import metarParser from "metar-parser";

const router = express.Router();

// Protect route with API key
router.use(protectRoute);

router.get("/decoded", async (req: Request, res: Response) => {
  getMetarData(req, res, true);
});

router.get("/", async (req: Request, res: Response) => {
  getMetarData(req, res);
});

async function getMetarData(req: Request, res: Response, decoded?: boolean) {
  if (!req.query.lat || !req.query.long)
    return res.status(400).send("Wrong coordinate format (?lat=50&long=4)");

  // Find station by coordinates
  try {
    const response = await IcaoDataModel.findOne({
      active: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [req.query.long, req.query.lat],
          },
        },
      },
    });
    if (!response)
      return res.status(400).send("No station found for this location");

    if (typeof req.query.date != "string" || !req.query.date)
      return res.status(400).send("Date is not a string (?date=2022-12-12)");

    // Find station by date
    const MAX_SEARCH_DIFFERENCE = 30 * 60 * 1000; // 30 minutes in milliseconds
    const date = new Date(req.query.date);
    const metarData = await MetarDataModel.aggregate([
      {
        $match: {
          ICAO: response.ICAO,
        },
      },
      {
        $addFields: {
          absDifference: {
            $abs: { $subtract: [date, "$createdAt"] },
          },
        },
      },
      {
        $match: {
          absDifference: { $lte: MAX_SEARCH_DIFFERENCE },
        },
      },
      { $sort: { absDifference: 1 } },
      { $limit: 1 },
    ]).then((result) => result[0]); // get the first item from the result array

    if (!metarData) return res.status(200).send({ data: [], results: 0 });

    if (decoded) {
      const decoded = metarParser(metarData.rawMetar);

      res.status(200).send({ data: [decoded], results: 1 });
    } else {
      res.status(200).send({ data: [metarData.rawMetar], results: 1 });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json("Error: " + error);
  }
}
export default router;

// Find all from date
// router.get("/", async (req: Request, res: Response) => {
//   if (!req.query.lat || !req.query.long)
//     return res.status(400).send("Wrong coordinate format (?lat=50&long=4)");

//   // Find station by coordinates
//   try {
//     const response = await IcaoDataModel.findOne({
//       location: {
//         $near: {
//           $geometry: {
//             type: "Point",
//             coordinates: [req.query.long, req.query.lat],
//           },
//         },
//       },
//     });
//     if (!response)
//       return res.status(400).send("No station found for this location");

//     if (typeof req.query.date != "string" || !req.query.date)
//       return res.status(400).send("Date is not a string (?date=2022-12-12)");

//     // Find station by date
//     const date = new Date(req.query.date);

//     const metarData = await MetarDataModel.find({
//       ICAO: response.ICAO,
//       createdAt: {
//         $gte: startOfDay(date),
//         $lte: endOfDay(date),
//       },
//     });

//     if (!metarData) return res.status(400).send("Such emtpy");

//     const decoded = metarData.map((v) => {
//       return metarParser(v.rawMetar);
//     });

//     res.status(201).send(decoded);
//   } catch (error) {
//     console.error(error);
//     res.status(400).json("Error: " + error);
//   }
// });
