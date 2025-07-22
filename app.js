import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fileUpload from "express-fileupload";
import cookieParser from "cookie-parser";
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger/swagger-output.json' with { type: 'json' };

import connectDB from "./config/db.js";
import rateLimiter from './middleware/rateLimiter.js';
import errorHandler from "./middleware/error.js";

import hrRoutes from "./routes/hr.js";
import superAdminRoutes from "./routes/superAdmin.js";
import dataEntryRoutes from "./routes/dataEntry.js";
import adminRoutes from "./routes/admin.js";
import teleCallerRoutes from "./routes/teleCaller.js";
import creditManagerRoutes from "./routes/creditManager.js";

export const app = express();

export const initializeDB = async () => {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
        throw new Error('❌ DATABASE_URL is not found!');
    }
    await connectDB(DATABASE_URL);
};

export const allowedOrigins = (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
    "http://localhost:5173",
    "https://mindfin-frontend.vercel.app"
]);

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('❌ Not allowed by CORS!'));
        }
    },
    methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    credentials: true
};

app.use(helmet());
app.use(rateLimiter({ max: 250 }));
app.use(cors(corsOptions));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "10000mb" }));
app.use(cookieParser());
app.use(fileUpload());
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan("dev"));
}

app.use("/api/hr", hrRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/tele-caller', dataEntryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/lead-handler", teleCallerRoutes);
app.use("/api/credit-manager", creditManagerRoutes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Path not found!", path: req.path, method: req.method });
});

app.use(errorHandler);