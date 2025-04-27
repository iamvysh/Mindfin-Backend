import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import cors from 'cors'
import morgan from 'morgan';
import http from "http"
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import middleError from "./middleware/error.js";
import cookieParser from "cookie-parser";




import hr from "./routes/hr.js"
import superAdmin from "./routes/superAdmin.js"
import { markAbsent } from "./utils/cronJob.js";


const envFilePath = `.env.${process.env.NODE_ENV}`;
dotenv.config({ path: envFilePath });

const PORT = process.env.PORT || 5050
const app = express();

app.use(cors())
connectDB();
app.use(morgan("dev"))
app.use(fileUpload())


app.use(bodyParser.json({
    limit: "100mb"
  }))
  
 app.use(cookieParser()) 
app.use(bodyParser.urlencoded({ limit: '10000mb' }));



app.use("/api/hr", hr)
app.use('/api/super-admin',superAdmin)
 



app.use(middleError);

markAbsent()


app.listen(PORT, () => {
    console.log(`running port ${PORT}`)
  
  })
