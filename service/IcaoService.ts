import IcaoDataModel from "../models/IcaoDataModel";

export async function getIcaoStationsFromDb(): Promise<string[]> {
  return (await IcaoDataModel.find().select("ICAO")).map((x) => x.ICAO);
}
