import { createTransport } from "nodemailer"
import { loadEnv } from "./envConfig.js"
// import dotenv from "dotenv";
// dotenv.config();
loadEnv()

const transport = createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.APP_PASS
    }
})

export default transport