import { Octokit } from "@octokit/rest";
import { octokitConfig } from "../lib/helper.js";
import { prisma } from "../lib/prisma.js";
import RepoBackup from "../queue/repoBackup.queue.js";
import fs from "fs";
import path from "path";
import { WithImplicitCoercion } from "buffer";
import {
    DeleteObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { Job } from "bullmq";
import { BackupType } from "../types/type.js";
import { github } from "better-auth/social-providers";

const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: process.env.IAM_ACCESS_KEY as string,
        secretAccessKey: process.env.IAM_SECRET_ACCESS_KEY as string,
    },
});

export async function backupRepository(
    repoId: number,
    type: BackupType,
    githubToken?: string
) {
    return await RepoBackup.add(repoId, type);
}

// This function will be used by queue worker to start repository backup
export async function initBackup(job: Job) {
    const repoId = job.data.repoId;
    const type: BackupType = job.data.type;
    let githubToken = job.data.githubToken as string;

    if (type == "webhook") {
        const data = await prisma.githubWebhook.findUnique({
            where: { repoId },
        });

        if (!data) {
            throw new Error(`No entry present in db for RepoId : ${repoId}`);
        }
        githubToken = data.accessToken;
    }

    const octokit = octokitConfig(githubToken);

    const { repoName, fileName, filePath, owner } = await downloadZipFile(
        repoId,
        octokit
    );
    await uploadFileToS3(repoName, fileName, filePath);
    return `Backup completed for repoName: ${repoName}, repoId: ${repoId}`;
}

async function downloadZipFile(repoId: number, octokit: Octokit) {
    const { data: repo } = await octokit.request(
        "GET /repositories/{repository_id}",
        { repository_id: Number(repoId) }
    );

    const owner = repo.owner.login;
    const repoName = repo.name;
    const branch = repo.default_branch || "main";

    // Get latest commit
    const { data: commit } = await octokit.repos.getCommit({
        owner,
        repo: repoName,
        ref: branch,
    });

    const latestCommitSha = commit.sha.substring(0, 7);

    const { data: zip } = await octokit.rest.repos.downloadZipballArchive({
        owner: owner,
        repo: repoName,
        ref: branch,
    });

    const outputDir = path.resolve("./downloads");

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const fileName = `${repoName}_${latestCommitSha}.zip`;
    const filePath = path.join(outputDir, fileName);

    await fs.promises.writeFile(
        filePath,
        Buffer.from(zip as WithImplicitCoercion<ArrayLike<number>>)
    );

    return {
        fileName,
        filePath,
        repoName,
        owner,
    };
}

async function uploadFileToS3(
    repoName: string,
    fileName: string,
    filePath: string
) {
    const putObject = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: fileName,
        Body: fs.createReadStream(filePath),
    });

    console.log(`${fileName} Uploading to S3 ...`);

    await s3Client.send(putObject);

    await deleteAllExceptLatest(repoName);

    if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);

    console.log(`${fileName} Successfully uploaded to S3 ...`);
}

async function deleteAllExceptLatest(repoName: string) {
    const { Contents: data } = await s3Client.send(
        new ListObjectsV2Command({
            Bucket: process.env.BUCKET_NAME,
            Prefix: repoName,
        })
    );

    if (data == undefined || data.length <= 1) return;

    data.sort((x, y) => {
        return (x.LastModified as Date) < (y.LastModified as Date) ? 1 : -1;
    });

    // Keep the latest one and delete others
    for (let i = 1; i < data.length; i++) {
        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: process.env.BUCKET_NAME as string,
                Key: data[i]?.Key,
            })
        );
    }
}
