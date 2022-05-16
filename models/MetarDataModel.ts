import { Schema, model } from "mongoose";
import type { MetarData } from "../types/MetarData";

const MetarDataSchema = new Schema<MetarData>({
  ICAO: {
    type: String,
    required: true,
  },
  qnh: {
    type: Number,
    required: false,
  },
  rawMetar: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: () => new Date(),
  },
});

export default model("MetarData", MetarDataSchema);
