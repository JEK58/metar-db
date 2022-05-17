import IcaoDataModel from "../models/IcaoDataModel";
import { ICAO } from "../config/ICAO";
import axios from "axios";
import * as cheerio from "cheerio";

export function fetchStationDetails() {
  ICAO.forEach(async (ICAO) => {
    // Fetch the data with ICAO Code
    const res = await getIcaoInfo(ICAO);
    if (!res) return;

    const entry = {
      ICAO,
      city: res.city,
      country: res.country,
      location: {
        type: "Point",
        coordinates: [res.location.long, res.location.lat],
      },
    };
    // Save new entry
    try {
      const icaoData = new IcaoDataModel(entry);
      await icaoData.save();
    } catch (error) {
      console.log(error);
    }
  });
  console.log("…done");
}

// Fetch data with ICAO Code and scrape station details
async function getIcaoInfo(ICAO: string) {
  try {
    const res = await axios.get("https://metar-taf.com/airport/" + ICAO);
    const html = res.data;
    const $ = cheerio.load(html);

    const city = $("table.table-second-label")
      .find("tr:contains('City')")
      .find("td")
      .eq(1)
      .text()
      .trim();

    const country = $("table.table-second-label")
      .find("tr:contains('Country')")
      .find("td")
      .eq(1)
      .text()
      .trim();

    const location = $("table.table-second-label")
      .find("tr:contains('Coordinates')")
      .find("td")
      .eq(1)
      .text()
      .trim();

    const [lat, long] = location.split(",");

    return {
      city,
      country,
      location: { lat: lat.trim(), long: long.trim() },
    };
  } catch (error) {
    console.error(error);
  }
}
