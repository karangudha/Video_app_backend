import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({path: './env'});

//check app.on 
connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("ERR ", error);
        throw error;
    })
})
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("MONGODB connection failed !! ", err);
})

