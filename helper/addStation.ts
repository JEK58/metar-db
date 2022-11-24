import IcaoDataModel from "../models/IcaoDataModel";
import axios from "axios";
import {
  addStation,
  getIcaoDetails,
  getIcaoStationsFromDb,
  getActiveIcaoStationsFromDb,
} from "../service/IcaoService";
import { initializeDB } from "../config/mongoose";
import { fetchMetarData } from "./fetchMetarData";

async function getStationDetails(ICAO: string[]) {
  const METAR_API_URL = "https://api.checkwx.com/station/";

  if (typeof process.env.METAR_API_KEY != "string")
    throw Error("METAR_API_KEY not set");

  const options = {
    headers: { "X-API-Key": process.env.METAR_API_KEY },
  };

  const url = METAR_API_URL + ICAO.join(",");
  const res = await axios.get(url, options);
  if (!res.data || res.data.results === 0) return;

  return res.data;
}

function formatNewStation(data: any) {
  const station = {
    ICAO: data.icao,
    name: data.name,
    city: data.city,
    country: data.city,
    location: data.geometry,
  };
  return station;
}

/**
 * Add stations manually
 */

async function main() {
  await initializeDB();
  const stations: string[] = [];

  // Get station details
  // const stationDetails = await getIcaoInfo(station);
  const res = await getStationDetails(stations);
  if (!res) return console.log("No station found for ICAO code: ", stations);

  const stationDetails = res.data;
  for (let i = 0; i < stationDetails.length; i++) {
    // Check if station is already in DB
    const exists = await getIcaoDetails(stationDetails[i].icao);

    if (exists) {
      console.log("Station already exists in DB: ", stationDetails[i].icao);
      continue;
    }

    // Add station to DB
    try {
      const newStation = formatNewStation(stationDetails[i]);
      const res = await addStation(newStation);
      // console.log(res);
    } catch (error) {
      console.log(stationDetails[i]);
      console.log(error);
    }
  }
}

async function findDuplicates() {
  await initializeDB();

  const res = await getIcaoStationsFromDb();
  console.log(res.length);
  console.log(res);

  for (let index = 0; index < res.length; index++) {
    const station = await IcaoDataModel.find({ ICAO: res[index] });
  }
}

async function findEmptyStations() {
  await initializeDB();

  const res = await getActiveIcaoStationsFromDb();

  for (let i = 0; i < res.length; i++) {
    const data = await fetchMetarData([res[i]]);
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!data) console.log("No data for: ", res[i]);
  }
}

const deactive = [
  "ETEK",
  "EDAX",
  "EDBN",
  "EDEL",
  "EDFE",
  "EDFK",
  "EDFQ",
  "EDFZ",
  "EDHE",
  "EDKA",
  "EDLS",
  "EDON",
  "EDQA",
  "EDQD",
  "EDQG",
  "EDRB",
  "EDRH",
  "EDRN",
  "EDRT",
  "EDRZ",
  "EDTF",
  "EDVA",
  "EDWG",
  "EDWO",
  "EDWR",
  "EDXA",
  "EDXB",
  "EDXH",
  "ETEJ",
  "ETIE",
  "ETNU",
  "ETSF",
  "ETUO",
  "EDBH",
  "ETHE",
  "ETID",
  "ETUR",
];
async function deactivateStation() {
  await initializeDB();

  for (let index = 0; index < deactive.length; index++) {
    const res = await IcaoDataModel.findOneAndUpdate(
      { ICAO: deactive[index] },
      { active: false },
      {
        new: true,
      }
    );
    console.log(res);
  }
}
// main();
// findDuplicates();
findEmptyStations();

// deactivateStation();
