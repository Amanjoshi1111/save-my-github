import { asyncHandler } from "../lib/helper.js";
import { NextFunction, Request, Response, Router } from "express";
import { prisma } from "../lib/prisma.js";
import CustomException from "../errorHandling/CustomException.js";
import { Webhooks } from "@octokit/webhooks";
import { backupRepository } from "../services/uploadService.js";
import { registerWebhook } from "../services/githubService.js";
import z from "zod";
import { GITHUB_TOKEN_HEADER } from "../lib/constants.js";
import { Octokit } from "@octokit/rest";

const webhookRouter: Router = Router();

const webhookSchema = z.object({
    repoId: z.number().positive(),
});

export default webhookRouter
    .post(
        "/backup",
        asyncHandler(async (req: Request, res: Response) => {
            await validateWebhookRequest(req);
            const event = req.headers["x-github-event"] as string;
            if (event != "push") {
                return res.status(200).json(`Event : ${event} recieved`);
            }

            const repoId = req.body.repository.id;
            await backupRepository(repoId, "webhook");

            return res.status(200).json(`Backup added for ${repoId}`);
        })
    )
    .post(
        "/register",
        asyncHandler(
            async (req: Request, res: Response, next: NextFunction) => {
                const { repoId } = webhookSchema.parse(req.body);
                const octokit = req.octokit as Octokit;
                const githubToken = req.githubToken as string;

                const repoName = await registerWebhook(
                    repoId,
                    githubToken,
                    octokit
                );

                res.json({
                    message: `Webhook created for ${repoName}`,
                });
            }
        )
    );

async function validateWebhookRequest(req: Request) {
    const signature = req.headers["x-hub-signature-256"] as string;
    const event = req.headers["x-github-event"] as string;
    const delivery = req.headers["x-github-delivery"] as string;

    const repoId = req.body?.repository?.id;
    if (!repoId) {
        throw new CustomException(
            "BE005",
            `Validation falied: no repoId found`
        );
    }

    const data = await prisma.githubWebhook.findUnique({
        where: {
            repoId,
        },
    });

    if (data == null) {
        throw new CustomException(
            "BE005",
            `No webhook registered for repoId : ${repoId}`
        );
    }

    const webhooks = new Webhooks({
        secret: data.webhookSecret,
    });

    const verifyResponse = await webhooks.verify(
        JSON.stringify(req.body),
        signature
    );

    if (!verifyResponse) {
        throw new CustomException("BE006");
    }

    // ✅ Log or queue the event for async processing
    console.log(`Received GitHub event: ${event} (${delivery})`);
}
