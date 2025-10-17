import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
dotenv.config();

const octokit: Octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

export default octokit;
