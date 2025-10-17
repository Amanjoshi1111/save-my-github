import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
dotenv.config();
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});
export default octokit;
//# sourceMappingURL=octokitConfig.js.map