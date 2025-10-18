import { NextFunction, Request, Response, Router } from "express";
import { asyncHandler, safeOctokitRequest } from "../lib.js";
import crypto from "crypto";
import { Worker } from "worker_threads";
import { Octokit } from "@octokit/rest";
import { fileURLToPath } from "url";
import path from "path";
import { prisma } from "../prisma.js";
import CustomException from "../CustomException.js";
import z from "zod";
import { githubTokenHeader } from "../constants.js";

const repoRouter: Router = Router();

type RepoSummary = {
    id: number;
    name: string;
    fullName: string;
    private: boolean;
    url: string;
};

repoRouter.get(
    "/repos",
    asyncHandler(async (req: Request, res: Response) => {
        const pageNo = Number(req.query.pageNo) || 1;
        const pageSize = Number(req.query.pageSize) || 10;

        const octokit = req.octokit as Octokit;

        const response = await safeOctokitRequest(() =>
            octokit.repos.listForAuthenticatedUser({
                per_page: pageSize,
                page: pageNo,
            })
        );

        const responseData: RepoSummary[] = response.data.map((data) => {
            return {
                id: data.id,
                name: data.name,
                fullName: data.full_name,
                private: data.private,
                url: data.html_url,
            };
        });
        return res.json(responseData);
    })
);

repoRouter.post(
    "/backup/:repoId",
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { repoId } = req.params;

        const octokit = req.octokit as Octokit;
        const token = req.headers["githubToken"] as string;

        await safeOctokitRequest(() => octokit.request("GET /user"));

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        console.log("Required Details : ", { token, repoId, __dirname });

        const workerPath = path.resolve(__dirname, "../../script.js");
        console.log("worketPath : ", workerPath);
        const worker = new Worker(workerPath, {
            workerData: { repoId, auth: token },
        });

        worker.once("message", async (response) => {
            try {
                const success = response.success;
                if (success) {
                    await prisma.backup.upsert({
                        where: {
                            repoId: Number(repoId),
                        },
                        update: {
                            lastBackupDate: new Date(),
                        },
                        create: {
                            owner: response.owner,
                            repoId: Number(repoId),
                            repoName: response.repoName,
                            lastBackupDate: new Date(),
                        },
                    });
                    return res.status(200).json({ message: response.msg });
                }
                console.log("error msg : ", response.error.message);
                throw new CustomException("BE099", response.error.message);
            } catch (err) {
                next(err);
            }
        });
        worker.once("error", (err) => {
            next(new CustomException("BE099", err.message));
        });
    })
);

const webhookSchema = z.object({
    repoId: z.number().positive(),
});

repoRouter.post(
    "/register/githubWebhook",
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { repoId } = webhookSchema.parse(req.body);

        const octokit = req.octokit as Octokit;
        const githubToken = req.headers[githubTokenHeader] as string;

        const { data: repo } = await safeOctokitRequest(() =>
            octokit.request("GET /repositories/{repository_id}", {
                repository_id: repoId,
            })
        );

        const owner = repo.owner.login;
        const repoName = repo.name;

        // Check weather their is already a webhook info present in db for this or not
        const dbWebhook = await prisma.githubWebhook.findUnique({
            where: { repoId },
        });

        const webhookURL = `${process.env.WEBHOOK_TUNNEL_URL}/webhook/github`;
        const secretToUse =
            dbWebhook?.webhookSecret ?? crypto.randomBytes(32).toString("hex");

        if (!dbWebhook) {
            // Create a webhook and save info in db.
            const { data: webhook } = await safeOctokitRequest(() =>
                octokit.repos.createWebhook({
                    owner,
                    repo: repoName,
                    events: ["push"],
                    config: {
                        content_type: "json",
                        url: webhookURL,
                        secret: secretToUse,
                    },
                })
            );
            await prisma.githubWebhook.create({
                data: {
                    repoId,
                    repoName,
                    owner,
                    webhookId: webhook.id,
                    webhookSecret: secretToUse,
                    accessToken: githubToken,
                },
            });
        } else {
            const { data: listWebhooks } = await safeOctokitRequest(() =>
                octokit.repos.listWebhooks({ owner, repo: repoName })
            );

            const requiredWebhook = listWebhooks.find(
                (wh) => wh.id === dbWebhook.webhookId || wh.url === webhookURL
            );

            if (!requiredWebhook) {
                //if no webhook present create one
                const webhookSecret = crypto.randomBytes(32).toString("hex");
                const { data: webhook } = await safeOctokitRequest(() =>
                    octokit.repos.createWebhook({
                        owner,
                        repo: repoName,
                        events: ["push"],
                        config: {
                            content_type: "json",
                            url: webhookURL,
                            secret: secretToUse,
                        },
                    })
                );

                await prisma.githubWebhook.update({
                    where: { repoId },
                    data: { webhookId: webhook.id, accessToken: githubToken },
                });
            } else {
                //Always update // Always overwrite GitHub webhook with DB secret (to maintain consistency)
                await safeOctokitRequest(() =>
                    octokit.repos.updateWebhook({
                        owner,
                        repo: repoName,
                        hook_id: requiredWebhook.id,
                        config: {
                            url: process.env.WEBHOOK_TUNNEL_URL as string,
                            content_type: "json",
                            secret: secretToUse, // overwrite with DB secret
                        },
                    })
                );
            }
        }

        res.json({
            message: `Webhook created for ${repoName}`,
        });
    })
);

export default repoRouter;
