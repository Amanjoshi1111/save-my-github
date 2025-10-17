import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});
const repoId = "729488540";
async function run() {
    const { data: repo } = await octokit.request("GET /repositories/{repository_id}", { repository_id: Number(repoId) });
    const owner = repo.owner.login;
    const repoName = repo.name;
    console.log(`Downloading ${owner}/${repoName} ...`);
    const response = await octokit.rest.repos.downloadZipballArchive({
        owner: owner,
        repo: repoName,
        ref: repo.default_branch || "main",
    });
    const outputDir = path.resolve("./downloads");
    if (!fs.existsSync(outputDir))
        fs.mkdirSync(outputDir);
    const filePath = path.join(outputDir, `${repoName}.zip`);
    fs.writeFileSync(filePath, Buffer.from(response.data));
    console.log(`Repo downloaded : ${filePath}`);
}
run().catch(console.error);
//# sourceMappingURL=script.js.map