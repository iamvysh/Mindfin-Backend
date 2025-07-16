import dotenv from 'dotenv-flow';
dotenv.config();
import { createServer } from "http";
import mongoose from 'mongoose';
import { app, initializeDB } from "./app.js";
import { markAbsent } from "./utils/cronJob.js";

const PORT = process.env.PORT || 5050;
const NODE_ENV = process.env.NODE_ENV;


const startServer = async () => {
  try {
    await initializeDB();
    markAbsent();
    const server = createServer(app);
    server.listen(PORT, () => {
      if (NODE_ENV !== 'production') {
        console.log(`✅ Server listening at http://localhost:${PORT}`);
      } else {
        console.log('✅ Server is running in production mode.');
      }
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('Shutting down server...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed.');
          process.exit(0);
        });
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (err) {
    console.error(`❌ Server startup failed: ${err.message}`);
    process.exit(1);
  }
};
startServer();
