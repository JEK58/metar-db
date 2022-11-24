import IcaoDataModel from "../models/IcaoDataModel";
import { IcaoDataCreate } from "../types/IcaoData";

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

export async function getIcaoDetails(ICAO: string) {
  return await IcaoDataModel.findOne({ ICAO }).exec();
}

export async function addStation(station: IcaoDataCreate) {
  const icaoData = new IcaoDataModel(station);
  return await icaoData.save();
}
