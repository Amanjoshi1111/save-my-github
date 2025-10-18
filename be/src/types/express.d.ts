import { Octokit } from "@octokit/rest";

declare global {
    namespace Express {
        interface Request {
            octokit?: Octokit;
            githubToken?: string;
        }
    }
}
