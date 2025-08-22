import {initORM} from "../db";
import jwt from "jsonwebtoken";
import {AppRole} from "../core/types/types";
import {BadRequestError} from "../app.error";
import * as crypto from "crypto";
import {getRedisClient} from "../core/helpers/utils";
import { OAuth2Client } from 'google-auth-library'

export class AuthService {
    private static instance: AuthService;
    private readonly googleClient: OAuth2Client;
    private constructor() {
        this.googleClient = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    async register(body: {email: string, password: string, fullName?: string}) {
        const db = await initORM();
        const existingUser = await db.user.findOne({
            email: body.email.toLowerCase(),
        })

        if (existingUser) {
            throw new BadRequestError("Email already exists");
        }

        const hashedPassword = await Bun.password.hash(body.password, "bcrypt")
        const user = db.user.create({
            email: body.email.toLowerCase(),
            role: AppRole.USER,
            password: hashedPassword,
        });

        await db.em.persistAndFlush(user);

        const userProfile = db.userProfile.create({
            fullName: body.fullName?.trim(),
            userId: user.id,
        })

        await db.em.persistAndFlush(userProfile);

        return {
            id: user.id,
            email: user.email,
        };
    }

    async processLogin(body: {email: string, password: string}, query?: {clientId?: string, scope?: string}) {
        const {accessToken, user} = await this.login(body);

        if (query?.clientId) {
            const {redirectUri, authorizationCode} = await this.generateAuthorizationCode(user.id, query.clientId, query.scope);
            return {
                redirectUri: `${redirectUri}?code=${authorizationCode}`,
            }
        }

        return {
            accessToken,
            user,
        };
    }

    async login(body: {email: string, password: string}) {
        const db = await initORM();
        const user = await db.user.findOne({
            email: body.email.toLowerCase(),
        }, {populate: ['password']});

        if (!user) {
            throw new BadRequestError("Invalid credentials");
        }

        const isPasswordValid = await Bun.password.verify(body.password, user.password, "bcrypt");
        if (!isPasswordValid) {
            throw new BadRequestError("Invalid credentials");
        }

        const jwtToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: 24 * 60 * 60 * 7, // 7 days
            }
        );

        return {
            accessToken: jwtToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };
    }
    
    async generateAuthorizationCode(userId: number, clientId: string, scope?: string) {
        const db = await initORM();
        const clientApplication = await db.clientApplication.findOne({
            clientId: clientId,
        });

        if (!clientApplication) {
            throw new BadRequestError("Client application not found");
        }

        const authorizationCode = crypto.randomBytes(32).toString("hex");
        const redisClient = await getRedisClient();

        // Delete any existing code for this user and client
        await redisClient.del("oauth:code:" + authorizationCode);

        // Store the authorization code in Redis with a 10-minute expiration
        await redisClient.set("oauth:code:" + authorizationCode, JSON.stringify({
            userId: userId,
            clientId: clientApplication.clientId,
            scope: scope || null,
        }), {
            EX: 60 * 10,
        });

        return {
            redirectUri: clientApplication.redirectUri,
            authorizationCode: authorizationCode,
        };
    }

    async exchangeCodeForToken(code: string, clientId: string, clientSecret: string) {
        const db = await initORM();
        const redisClient = await getRedisClient();
        const tokenData = await redisClient.get("oauth:code:" + code);

        if (!tokenData) {
            throw new BadRequestError("Invalid or expired authorization code");
        }

        const { userId, clientId: storedClientId, scope } = JSON.parse(tokenData);

        await redisClient.del("oauth:code:" + code);

        const clientApplication = await db.clientApplication.findOne({
            clientId: clientId,
        }, {populate: ['clientSecret']});

        if (!clientApplication || !clientApplication.clientSecret) {
            throw new BadRequestError("Client application not found");
        }

        const isValidClientSecret = await Bun.password.verify(clientSecret, clientApplication.clientSecret, "bcrypt");

        if (!isValidClientSecret) {
            throw new BadRequestError("Invalid client secret");
        }

        if (storedClientId !== clientId) {
            throw new BadRequestError("Authorization code belongs to a different client");
        }

        const user = await db.user.findOne({
            id: userId,
        });

        if (!user) {
            throw new BadRequestError("User not found");
        }

        const jwtToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: 24 * 60 * 60 * 7,
            }
        );

        if(scope && scope.split(",").includes("profile")) {
            const userProfile = await db.userProfile.findOne({
                userId: user.id,
            });

            if (userProfile) {
                return {
                    accessToken: jwtToken,
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        profile: {
                            fullName: userProfile.fullName,
                            avatarUrl: userProfile.avatarUrl,
                        },
                    },
                };
            }
        }

        return {
            accessToken: jwtToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };
    }

    async loginWithOauth(userId: number, query?: {clientId?: string, scope?: string}) {
        const db = await initORM();
        const user = await db.user.findOne({ id: userId });

        if (!user) {
            throw new BadRequestError("User not found");
        }

        const jwtToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: 24 * 60 * 60 * 7, // 7 days
            }
        );

        if (query?.clientId) {
            const { redirectUri, authorizationCode } = await this.generateAuthorizationCode(user.id, query.clientId, query.scope);
            return {
                redirectUri: `${redirectUri}?code=${authorizationCode}`,
            };
        }

        return {
            accessToken: jwtToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };
    }

    async loginWithGoogle(body: {tokenId: string}) {
        const db = await initORM();
        const { tokenId } = body;
        if(!tokenId) {
            throw new BadRequestError("Google credential is required");
        }

        const ticket = await this.googleClient.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload()


        if (!payload || !payload.email) {
            throw new BadRequestError("Invalid Google credential");
        }

        if(!payload.email_verified) {
            throw new BadRequestError("Google account email is not verified");
        }

        const user = await db.user.findOne({
            email: payload.email.toLowerCase(),
        })

        if (user) {
            const jwtToken = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
                process.env.JWT_SECRET!,
                {
                    expiresIn: 24 * 60 * 60 * 7, // 7 days
                }
            );

            return {
                accessToken: jwtToken,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
            };
        }

        const hashedPassword = await Bun.password.hash("123456", "bcrypt");

        const newUser = db.user.create({
            email: payload.email.toLowerCase(),
            role: AppRole.USER,
            password: hashedPassword,
        });

        await db.em.persistAndFlush(newUser);
        const userProfile = db.userProfile.create({
            fullName: payload.name?.trim(),
            avatarUrl: payload.picture,
            userId: newUser.id,
        });

        await db.em.persistAndFlush(userProfile);

        const jwtToken = jwt.sign(
            {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: 24 * 60 * 60 * 7, // 7 days
            }
        );

        return {
            accessToken: jwtToken,
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
            },
        };
    }
}