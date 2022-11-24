import mongoose from "mongoose";

const uri = process.env.DB_CONNECTION;
const dbName = process.env.MONGO_DB_NAME;

export async function initializeDB() {
  // Initial connection
  try {
    if (!uri) throw Error("No DB_CONNECTION env variable found");

    // Allow undefined dbName in development to use test DB
    if (!dbName && process.env.NODE_ENV === "production")
      throw Error("No DB_CONNECTION env variable found");

    return await mongoose.connect(uri, { dbName });
  } catch (error) {
    console.error(error);
  }
  // Logs connection errors after initial connection
  mongoose.connection.on("error", (err: Error) => {
    console.error(err);
  });
}

initializeDB();

const mongodb = mongoose.connection;
mongodb.on("error", () => console.error("connection error:"));
mongodb.once("open", () => console.info("Connected to DB"));
