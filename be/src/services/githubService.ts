import { Octokit } from "@octokit/rest";
import { safeOctokitRequest } from "../lib/helper.js";
import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

type RepoSummary = {
    id: number;
    name: string;
    fullName: string;
    private: boolean;
    url: string;
};

type CreateWebhookInfo = {
    owner: string;
    repoName: string;
    secret: string;
    octokit: Octokit;
    url: string;
};

export async function fetchRepoList(
    pageNo: number,
    pageSize: number,
    octokit: Octokit
) {
    const response = await safeOctokitRequest(() =>
        octokit.repos.listForAuthenticatedUser({
            per_page: pageSize,
            page: pageNo,
        })
    );

    const userRepoList: RepoSummary[] = response.data.map((data) => {
        return {
            id: data.id,
            name: data.name,
            fullName: data.full_name,
            private: data.private,
            url: data.html_url,
        };
    });

    return userRepoList;
}



export async function registerWebhook(
    repoId: number,
    githubToken: string,
    octokit: Octokit
) {
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
        const { data: webhook } = await createWebhookHelper({
            owner,
            secret: secretToUse,
            octokit,
            repoName,
            url: webhookURL,
        });

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

            const { data: webhook } = await createWebhookHelper({
                owner,
                secret: secretToUse,
                octokit,
                repoName,
                url: webhookURL,
            });

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
                        url: webhookURL,
                        content_type: "json",
                        secret: secretToUse, // overwrite with DB secret
                    },
                })
            );
        }
    }
    return repoName;
}

async function createWebhookHelper({
    owner,
    octokit,
    repoName,
    secret,
    url,
}: CreateWebhookInfo) {
    return await safeOctokitRequest(() =>
        octokit.repos.createWebhook({
            owner: owner,
            repo: repoName,
            events: ["push"],
            config: {
                content_type: "json",
                url,
                secret,
            },
        })
    );
}
