import IcaoDataModel from "../models/IcaoDataModel";

export async function getIcaoStationsFromDb(): Promise<string[]> {
  return (await IcaoDataModel.find().select("ICAO")).map((x) => x.ICAO);
}

export async function getActiveIcaoStationsFromDb(): Promise<string[]> {
  return (await IcaoDataModel.find({ active: true }).select("ICAO")).map(
    (x) => x.ICAO
  );
}

export async function getInactiveIcaoStationsFromDb(): Promise<string[]> {
  return (await IcaoDataModel.find({ active: false }).select("ICAO")).map(
    (x) => x.ICAO
  );
}
