import { Worker } from "bullmq";
import { REPOSITORY_BACKUP_QUEUE } from "../lib/constants.js";
import dotenv from "dotenv";
import { initBackup } from "../services/uploadService.js";
dotenv.config();

const worker = new Worker(
    REPOSITORY_BACKUP_QUEUE,
    async (job) => {
        console.log(
            `Consuming Job : JobId : ${job.id}, JobData: ${job.data.repoId}`
        );
        const message = await initBackup(job);
        console.log(message);
    },
    {
        connection: {
            host: process.env.REDIS_URL,
            port: Number(process.env.REDIS_PORT),
        },
    }
);

worker.on("failed", (job, err) => {
    console.error(`Job : ${job?.id} failed:`, err);
});

worker.on("completed", (job) => {
    console.log(`Job : ${job.id} completed!`);
});
