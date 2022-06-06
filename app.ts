import "dotenv/config";
import axios from "axios";
import "./config/mongoose";
import MetarDataModel from "./models/MetarDataModel";
import type { MetarApiResponses } from "./types/MetarData";
import cron from "cron";
import { sendMail } from "./config/sendMail";
import express from "express";
import http from "http";
import routes from "./routes";
import { getIcaoStationsFromDb } from "./service/IcaoService";

// Error handling
process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
  process.exit(1); //mandatory (as per the Node.js docs)
});

console.log(`Running in ${process.env.NODE_ENV} mode`);

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
// app.use(cors());

app.use("", routes);

const port = process.env.PORT || 3031;

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

if (process.env.NODE_ENV === "development") {
  // Run every 30 seconds for development
  console.log("Run cron job every 30 seconds for development");
  // new cron.CronJob("5 * * * * *", main, null, true, "UTC");
} else {
  // Run every 30 minutes from 6h to 21h at :03 & :33
  console.log("Run cron job every 20 minutes from 5h to 21h");
  new cron.CronJob("*/20 5-21 * * * ", main, null, true, "UTC");
}

async function main() {
  console.log("Running cron job at ", new Date());
  try {
    const listOfStations = await getIcaoStationsFromDb();
    const res = await fetch(listOfStations);
    if (!res) throw Error("No data received");

    const newDbEntries = res.data.map((el) => {
      return {
        ICAO: el.icao,
        rawMetar: el.raw_text,
        observed: el.observed,
      };
    });
    await MetarDataModel.insertMany(newDbEntries);

    console.log("…done");
  } catch (error) {
    console.log(error);
    sendMail("METAR DB Error", JSON.stringify(error));
  }
}

// Fetch METAR data for ICAO Codes
async function fetch(ICAO: string[]): Promise<MetarApiResponses | undefined> {
  if (typeof process.env.METAR_API_KEY != "string")
    throw Error("METAR_API_KEY not set");

  const options = {
    headers: { "X-API-Key": process.env.METAR_API_KEY },
  };

  const res = await axios.get(
    "https://api.checkwx.com/metar/" + ICAO.join(",") + "/decoded",
    options
  );
  if (!res.data || res.data.results === 0) return;

  return res.data;
}
