import dotenv from "dotenv"



export const loadEnv = () => {
    const envFilePath = `.env.${process.env.NODE_ENV}`;
    dotenv.config({ path: envFilePath });
}