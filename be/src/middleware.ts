import { NextFunction, Request, Response } from "express";
import CustomException from "./errorHandling/CustomException.js";
import { Prisma } from "@prisma/client";
import { fromNodeHeaders } from "better-auth/node";
import { auth, SessionType, UserType } from "./lib/auth.js";
import {
    asyncHandler,
    octokitConfig,
    safeOctokitRequest,
} from "./lib/helper.js";
import cors from "cors";
import { GITHUB_TOKEN_HEADER } from "./lib/constants.js";
import { prisma } from "./lib/prisma.js";

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.log("Error : ", err);

    if (err instanceof CustomException) {
        return res.status(err.status).json({
            code: err.code,
            message: err.message,
        });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // unique constraint violation, foreign key violation
        return res.status(400).json({
            code: "BE400",
            message: err.message,
        });
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
        // Invalid query shape or missing required fields
        return res.status(400).json({
            code: "BE400",
            message: err.message,
        });
    }

    if (
        err instanceof Prisma.PrismaClientUnknownRequestError ||
        err instanceof Prisma.PrismaClientRustPanicError ||
        err instanceof Prisma.PrismaClientInitializationError
    ) {
        // Unexpected server or Prisma internal errors
        return res.status(500).json({
            code: "BE099",
            message: "INTERNAL SERVER ERROR",
        });
    }

    return res.status(500).json({
        code: "BE099",
        message: "INTERNAL SERVER ERROR",
    });
};

export const customResponse = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const oldJson = res.json;
    res.json = function (data: any) {
        const formatted = {
            code: "BE000",
            status: res.statusCode,
            data,
        };
        return oldJson.call(this, formatted);
    };
    next();
};

export const requireAuth = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session) {
            throw new CustomException("BE006");
        }

        req.session = session.session as SessionType;
        req.user = session.user as UserType;
        next();
    }
);

export const corsMiddleware = cors({
    origin: ["http://localhost:3001", "http://localhost:3000"],
    credentials: true, // This is crucial for cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
});

export const me = asyncHandler(async (req, res) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
        query: { disableCookieCache: true },
    });
    return res.json(session);
});

export const validateGithubToken = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user?.id) {
            throw new CustomException("BE006");
        }

        const account = await prisma.account.findFirst({
            where: {
                userId: user?.id,
                providerId: "github",
            },
        });

        const githubToken = account?.accessToken;

        if (githubToken == undefined) {
            throw new CustomException("BE002");
        }

        const octokit = octokitConfig(githubToken);

        const { data: repo } = await safeOctokitRequest(() =>
            octokit.request("GET /user")
        );

        req.octokit = octokit;
        req.githubToken = githubToken;
        req.githubUser = repo.login;

        next();
    }
);
