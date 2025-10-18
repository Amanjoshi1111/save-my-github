import z from "zod";
import crypto from "crypto";
import { asyncHandler } from "../lib.js";
import { Request, Response, Router } from "express";
import CustomException from "../CustomException.js";
import { prisma } from "../prisma.js";

const webhookSchema = z.object({
    repoId: z.number().positive(),
});

const webhookRouter: Router = Router();

webhookRouter.post(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
        const signature = req.headers["x-hub-signature-256"] as string;
        const event = req.headers["x-github-event"] as string;
        const delivery = req.headers["x-github-delivery"] as string;

        if (!signature || !event || !delivery) {
            throw new CustomException("BE004");
        }

        const repoId = req.body.repository.id;

        const data = await prisma.githubWebhook.findUnique({
            where: {
                repoId,
            },
        });

        if (data == null) {
            throw new CustomException("BE005");
        }

        const webhookSecret = data.webhookSecret;

        // Retrieve the secret from your database
        const payload = JSON.stringify(req.body);

        const hmac = crypto.createHmac("sha256", webhookSecret);
        const digest = `sha256=${hmac.update(payload).digest("hex")}`;

        console.log()
        if (signature !== digest) {
            throw new CustomException("BE003");
        }

        // ✅ Log or queue the event for async processing
        console.log(`Received GitHub event: ${event} (${delivery})`);

        // For example: enqueue backup job
        // await queueBackupJob(req.body);

        // ⚡ Respond quickly
        return res.status(200).json({ success: true });
    })
);

export default webhookRouter;
