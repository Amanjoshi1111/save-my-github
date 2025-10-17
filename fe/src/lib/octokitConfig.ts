import { Octokit } from "@octokit/rest";
import { getGithubAccessToken } from "./github";

export const getOctokitConfig = async () => {
    const authToken = await getGithubAccessToken();
    return new Octokit({
        auth: authToken,
    });
};
