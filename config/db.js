import mongoose from "mongoose";

const connectDB = async (DATABASE_URL) => {
    const MAX_RETRIES = 3;
    let retryCount = 0;

    const connectWithRetry = async () => {
        try {
            const DB_OPTIONS = {
                dbName: process.env.DB_NAME || "mindfin",
                maxPoolSize: 20,
                serverSelectionTimeoutMS: 5000,
                // ssl: process.env.NODE_ENV === "production",
                // sslValidate: true
            };
            await mongoose.connect(DATABASE_URL, DB_OPTIONS);
            console.log(`✅ Connected to database: ${DB_OPTIONS.dbName}`);
        } catch (error) {
            retryCount++;
            if (retryCount < MAX_RETRIES) {
                console.warn(`⚠️ Retrying DB connection (${retryCount}/${MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
                return connectWithRetry();
            }
            throw error;
        }
    };

    mongoose.connection.on("connected", () => {
        console.log("✅ Mongoose connected to DB.");
    });
    mongoose.connection.on("error", (err) => {
        console.error(`❌ Mongoose connection error: ${err.message}`);
    });
    mongoose.connection.on("disconnected", () => {
        console.warn("⚠️ Mongoose disconnected from DB!");
    });

    try {
        await connectWithRetry();
    } catch (error) {
        console.error(`❌ FATAL DB connection error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;