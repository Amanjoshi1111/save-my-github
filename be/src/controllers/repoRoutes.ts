import { NextFunction, Request, Response, Router } from "express";
import {
    asyncHandler,
    octokitConfig,
    safeOctokitRequest,
} from "../lib/helper.js";
import { Worker } from "worker_threads";
import { Octokit } from "@octokit/rest";
import { fileURLToPath } from "url";
import path from "path";
import { prisma } from "../lib/prisma.js";
import CustomException from "../errorHandling/CustomException.js";
import z from "zod";
import { fetchRepoList, registerWebhook } from "../services/githubService.js";
import { GITHUB_TOKEN_HEADER } from "../lib/constants.js";
import RepoBackup from "../queue/repoBackup.queue.js";

const repoRouter: Router = Router();

export default repoRouter
    .get(
        "/repos",
        asyncHandler(async (req: Request, res: Response) => {
            const pageNo = Number(req.query.pageNo) || 1;
            const pageSize = Number(req.query.pageSize) || 10;
            const octokit = req.octokit as Octokit;

            const userRepoList = await fetchRepoList(pageNo, pageSize, octokit);
            return res.status(200).json(userRepoList);
        })
    )
    .post(
        "/instantBackup/:repoId",
        asyncHandler(
            async (req: Request, res: Response, next: NextFunction) => {
                const { repoId } = req.params;
                const repoIdNum = Number(repoId);

                const octokit = req.octokit as Octokit;
                const githubUser = req.githubUser as string;
                const githubToken = req.githubToken;

                if (isNaN(repoIdNum)) {
                    throw new CustomException(
                        "BE004",
                        "RepoId should be a valid number"
                    );
                }

                const { data: repoList } = await safeOctokitRequest(() =>
                    octokit.repos.listForUser({
                        username: githubUser,
                    })
                );

                const repoData = repoList.find((r) => r.id === repoIdNum);

                if (!repoData) {
                    throw new CustomException(
                        "BE004",
                        "No such repo present for given repoId"
                    );
                }

                const job = await RepoBackup.add(
                    Number(repoId),
                    "instant",
                    githubToken
                );

                return res
                    .status(200)
                    .send({ message: "Pushed to queue", jobId: job.id });
            }
        )
    );
