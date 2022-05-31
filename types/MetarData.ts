export interface MetarData {
  ICAO: string;
  rawMetar: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetarDataCreate
  extends Omit<MetarData, "createdAt" | "updatedAt"> {}
