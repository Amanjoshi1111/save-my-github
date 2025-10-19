import { Worker } from "bullmq";
import { REPOSITORY_BACKUP_QUEUE } from "../constants.js";
import dotenv from "dotenv";
dotenv.config();

const worker = new Worker(
    REPOSITORY_BACKUP_QUEUE,
    async (job) => {
        console.log("consuming job : ", job.id, job.data);
    },
    {
        connection: {
            host: process.env.REDIS_URL,
            port: Number(process.env.REDIS_PORT),
        },
    }
);

worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed!`);
});
