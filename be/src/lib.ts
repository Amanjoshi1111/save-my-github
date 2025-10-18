import { RequestError } from "@octokit/request-error";
import { NextFunction, Request, RequestHandler, Response } from "express";
import CustomException from "./CustomException.js";
import { Octokit } from "@octokit/rest";
import { githubTokenHeader } from "./constants.js";

export const octokitConfig = (auth: string): Octokit => {
    return new Octokit({
        auth: auth,
    });
};

export const asyncHandler =
    (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) =>
        Promise.resolve(fn(req, res, next)).catch(next);

export async function safeOctokitRequest<T>(fn: () => Promise<T>): Promise<T> {
    try {
        return await fn();
    } catch (err: any) {
        if (err instanceof RequestError) {
            if (err.status === 404) {
                throw new CustomException("BE001", "Repository not found");
            }
            if (err.status === 401) {
                throw new CustomException("BE001", "Invalid github token");
            }
            throw new CustomException("BE001", err.message);
        }
        throw new CustomException("BE099");
    }
}

export async function validateGithubToken(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const githubToken: string = req.headers[githubTokenHeader] as string;

    if (githubToken == undefined) {
        throw new CustomException("BE002");
    }

    const octokit = octokitConfig(githubToken);

    const { data: repo } = await safeOctokitRequest(() =>
        octokit.request("GET /user")
    );

    req.octokit = octokit;
    req.githubToken = githubToken;
    next();
}
