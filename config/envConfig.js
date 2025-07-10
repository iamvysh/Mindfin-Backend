import dotenv from "dotenv"



export const loadEnv = () => {
    const envFilePath = `.env.${process.env.NODE_ENV}`;
    dotenv.config({ path: envFilePath });
}

// import dotenv from "dotenv";
// import fs from "fs";

// export const loadEnv = () => {
//     const envFilePath = `.env.${process.env.NODE_ENV}`;
//     console.log(`🌱 Loading env from: ${envFilePath}`);

//     if (!fs.existsSync(envFilePath)) {
//         console.error(`❌ Env file not found at: ${envFilePath}`);
//         return;
//     }

//     dotenv.config({ path: envFilePath });

//     if (!process.env.DB_URL) {
//         console.error("❌ DB_URL is not defined in the env file.");
//     } else {
//         console.log("✅ DB_URL loaded successfully.");
//     }
// };
