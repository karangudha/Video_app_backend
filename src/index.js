import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({path: './env'});


connectDB();
/*
import express from "express";

const app = express();

//We can connect database in one lone of code, but rembember database are
//in other continent, so it will take time to connect to database, so it's a good practice
//to use async, await and also use try and catch exceptions bcz many times we get error 
//while connecting with database.

( async () => {
    try{
        await mongoose.connect (`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERR ", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on ${process.env.PORT}`);
        })
    } catch (error)
    {
        console.error("ERROR: ", error)
        throw err
    }
})()
    
*/