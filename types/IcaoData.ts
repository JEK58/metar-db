import type { GeoJSON } from "geojson";

export interface IcaoData {
  ICAO: string;
  city: string;
  country: string;
  location: GeoJSON.Point;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IcaoDataCreate
  extends Omit<IcaoData, "createdAt" | "updatedAt"> {}
