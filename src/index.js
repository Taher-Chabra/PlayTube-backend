import dotenv from "dotenv";
dotenv.config();
import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on PORT: ${process.env.PORT}`);
    });

    app.on("error", (error) => {
      console.error("Error starting the server:", error);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection FAILED !!!", error);
  });
