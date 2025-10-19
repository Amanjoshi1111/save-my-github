import { asyncHandler } from "../lib/helper.js";
import { Request, Response, Router } from "express";
import { prisma } from "../lib/prisma.js";
import CustomException from "../errorHandling/CustomException.js";
import { Webhooks } from "@octokit/webhooks";
import { backupRepository } from "../services/backupService.js";

const webhookRouter: Router = Router();

export default webhookRouter.post(
    "/github",
    asyncHandler(async (req: Request, res: Response) => {
        await validateWebhookRequest(req);

        const event = req.headers["x-github-event"] as string;
        if (event != "push") {
            return res.status(200).json(`Event : ${event} recieved`);
        }

        const repoId = req.body.repository.id;
        await backupRepository(repoId);

        return res.status(200).json(`Backup added for ${repoId}`);
    })
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
