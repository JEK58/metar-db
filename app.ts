import "dotenv/config";
import axios from "axios";
import "./config/mongoose";
import MetarDataModel from "./models/MetarDataModel";
import cron from "cron";
import { sendMail } from "./config/sendMail";
import express from "express";
import http from "http";
import routes from "./routes";
import { getIcaoStationsFromDb } from "./service/IcaoService";
import axiosRetry from "axios-retry";
import helmet from "helmet";
import { checkStationsOnlineStatus } from "./helper/stationHealthCheck";
import { fetchMetarData } from "./helper/fetchMetarData";

// Setup
axiosRetry(axios, { retries: 3 });

// Error handling
process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
  process.exit(1); //mandatory (as per the Node.js docs)
});

console.log(`Running in ${process.env.NODE_ENV} mode`);

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(express.json());
// app.use(cors());

app.use("", routes);

const port = process.env.PORT || 3031;

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

if (process.env.NODE_ENV === "development") {
  // console.log("Run cron job every 30 seconds for development");
  // new cron.CronJob("5 * * * * *", main, null, true, "UTC");
} else {
  console.log("Run cron job every 15 minutes from 5h to 21h");
  new cron.CronJob("*/15 * * * * ", main, null, true, "UTC");
  new cron.CronJob("0 21 * * * ", checkStationsOnlineStatus, null, true, "UTC");
}

async function main() {
  console.log("Running cron job at ", new Date());
  try {
    const listOfStations = await getIcaoStationsFromDb();
    const res = await fetchMetarData(listOfStations);
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
    sendMail("⚠️ METAR DB Error", JSON.stringify(error));
  }
}
