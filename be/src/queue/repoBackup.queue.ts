import { Queue, Worker } from "bullmq";
import { REPOSITORY_BACKUP_QUEUE } from "../constants.js";
import dotenv from "dotenv";
dotenv.config();

export default class RepoBackup {
    private static queue = new Queue(REPOSITORY_BACKUP_QUEUE, {
        connection: {
            host: process.env.REDIS_URL,
            port: Number(process.env.REDIS_PORT)
        },
    });

    public static async add(repoId: number) {
        const jobId = `backup_${repoId}`;
        const existingJob = await this.queue.getJob(jobId);

        if (existingJob) {
            const state = await existingJob.getState();
            if (state != "active") {
                await existingJob.remove();
                console.log(`Removed old job for ${repoId}`);
            }
        }

        const jobName = `backup:${repoId}`;
        const job = await this.queue.add(
            jobName,
            { repoId },
            {
                jobId,
                attempts: 2,
                removeOnComplete: true,
                removeOnFail: false,
            }
        );

        console.log(`Job added for (repo :${repoId}, jobId : ${job.id})`);
        return job;
    }
}
