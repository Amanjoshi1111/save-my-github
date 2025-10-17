import { Octokit } from "@octokit/rest";

export const octokitConfig = (auth?: string): Octokit => {
  return new Octokit({
    auth: auth || process.env.GITHUB_TOKEN,
  });
};
