import mongoose, { Error } from "mongoose";

// Initial connection
try {
  mongoose.connect(process.env.DB_CONNECTION ?? "", {});
} catch (error) {
  console.error(error);
}
// Logs connection errors after initial connection
mongoose.connection.on("error", (err: Error) => {
  console.error(err);
});

const mongodb = mongoose.connection;
mongodb.on("error", () => console.error("connection error:"));
mongodb.once("open", () => console.info("Connected to DB"));
