import { NextFunction, Request, Response, Router } from "express";
import { asyncHandler, safeOctokitRequest } from "../lib.js";
import { Worker } from "worker_threads";
import { Octokit } from "@octokit/rest";
import { fileURLToPath } from "url";
import path from "path";
import { prisma } from "../prisma.js";
import CustomException from "../CustomException.js";
import z from "zod";
import { githubTokenHeader } from "../constants.js";
import { fetchRepoList, registerWebhook } from "../services/githubService.js";

const webhookSchema = z.object({
    repoId: z.number().positive(),
});

const repoRouter: Router = Router();

export default repoRouter
    .get(
        "/repos",
        asyncHandler(async (req: Request, res: Response) => {
            const pageNo = Number(req.query.pageNo) || 1;
            const pageSize = Number(req.query.pageSize) || 10;
            const octokit = req.octokit as Octokit;

            const userRepoList = fetchRepoList(pageNo, pageSize, octokit);
            return res.json(userRepoList);
        })
    )
    .post(
        "/backup/:repoId",
        asyncHandler(
            async (req: Request, res: Response, next: NextFunction) => {
                const { repoId } = req.params;

                const octokit = req.octokit as Octokit;
                const token = req.headers["githubToken"] as string;

                await safeOctokitRequest(() => octokit.request("GET /user"));

                const __filename = fileURLToPath(import.meta.url);
                const __dirname = path.dirname(__filename);

                console.log("Required Details : ", {
                    token,
                    repoId,
                    __dirname,
                });

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
                            return res
                                .status(200)
                                .json({ message: response.msg });
                        }
                        console.log("error msg : ", response.error.message);
                        throw new CustomException(
                            "BE099",
                            response.error.message
                        );
                    } catch (err) {
                        next(err);
                    }
                });
                worker.once("error", (err) => {
                    next(new CustomException("BE099", err.message));
                });
            }
        )
    )
    .post(
        "/register/githubWebhook",
        asyncHandler(
            async (req: Request, res: Response, next: NextFunction) => {
                const { repoId } = webhookSchema.parse(req.body);
                const octokit = req.octokit as Octokit;
                const githubToken = req.headers[githubTokenHeader] as string;

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
