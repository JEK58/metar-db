import axios from "axios";
import * as cheerio from "cheerio";
import "./config/mongoose";
import MetarDataModel from "./models/MetarDataModel";
import type { MetarDataCreate } from "./types/MetarData";
import { ICAO } from "./config/ICAO";
import cron from "cron";
import { sendMail } from "./config/sendMail";

console.log(`Running in ${process.env.NODE_ENV} mode`);

// Run every hour from 6h to 21h
new cron.CronJob("3 6-21 * * * *", main, null, true, "UTC");

// Run every 30 seconds for development
// new cron.CronJob("30 * * * * *", main, null, true, "UTC");

function main() {
  console.log("Running cron job at ", new Date());
  ICAO.forEach(async (ICAO) => {
    // Fetch the data with ICAO Code
    const res = await fetch(ICAO);
    if (!res) return;

    // Get latest entry from database
    const latest = await MetarDataModel.findOne({ ICAO }).sort("-_id");

    // Check if rawMetar has changed before saving a new entry
    if (latest && latest.rawMetar == res.rawMetar) return;

    // Save new entry
    try {
      const metarData = new MetarDataModel(res);
      const dbRes = await metarData.save();
      console.log("…done");

      // console.log(dbRes);
    } catch (error) {
      sendMail("QNH Scraper Error", JSON.stringify(error));
      console.log(error);
    }
  });
}

// Fetch data with ICAO Code and scrape qnh & METAR
async function fetch(ICAO: string): Promise<MetarDataCreate | undefined> {
  try {
    const res = await axios.get("https://metar-taf.com/" + ICAO);
    const html = res.data;
    const $ = cheerio.load(html);

    // Find qnh
    let scrapedata = $("h3.mb-0").eq(4).text().replace(" inHg", "").trim();

    // Convert it to hPa and round it to 2 decimals
    const qnhInHg = parseFloat(scrapedata) / 0.02953;
    const qnh = Math.round((qnhInHg + Number.EPSILON) * 100) / 100;
    // Find raw METAR data
    const rawMetar = $("code").text();

    if (!rawMetar) return;

    return { ICAO, qnh, rawMetar };
  } catch (error) {
    sendMail("QNH Scraper Error", JSON.stringify(error));
    console.error(error);
  }
}
