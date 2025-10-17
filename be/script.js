import { Octokit } from "@octokit/rest";
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { parentPort, workerData } from "worker_threads";

const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: process.env.IAM_ACCESS_KEY,
        secretAccessKey: process.env.IAM_SECRET_ACCESS_KEY
    }
})

async function run(repoId, auth) {

    const octokit = new Octokit({
        auth
    });

    const { repoName, fileName, filePath, owner } = await downloadZipFile(repoId, octokit);
    await uploadFileToS3(repoName, fileName, filePath);
    return { success: true, msg: "Upload done...", repoName, owner };
}

async function downloadZipFile(repoId, octokit) {

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
        ref: branch
    })

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

    console.log("filePath : ", filePath);

    await fs.promises.writeFile(filePath, Buffer.from(zip));
    console.log(`Repo downloaded : ${filePath}`);

    return {
        fileName, filePath, repoName, owner
    }
}

async function uploadFileToS3(repoName, fileName, filePath) {

    const putObject = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: fileName,
        Body: fs.createReadStream(filePath)
    })

    console.log(`${fileName} Uploading to S3 ...`);

    await s3Client.send(putObject);

    await deleteAllExceptLatest(repoName);

    if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);

    console.log(`${fileName} Successfully uploaded to S3 ...`);
}

async function deleteAllExceptLatest(repoName) {
    const { Contents: data } = await s3Client.send(new ListObjectsV2Command({
        Bucket: process.env.BUCKET_NAME,
        Prefix: repoName
    }));



    if (data != undefined && data.length <= 1)
        return;

    data.sort((x, y) => {
        return new Date(x.LastModified) < new Date(y.LastModified) ? 1 : -1;
    })

    // Keep the latest one and delete others
    for (let i = 1; i < data.length; i++) {
        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: data[i].Key
        }))
    };
}

async function init(workerData) {
    try {
        const response = await run(workerData.repoId, workerData.auth);
        parentPort.postMessage(response);
    } catch (err) {
        console.log("SCRIPT : error");
        parentPort.postMessage({ success: false, error: err });
    }
}

init(workerData);