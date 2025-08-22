import {initORM} from "../db";
import * as crypto from "crypto";
import {User} from "../entities/user.entity";
import {BadRequestError} from "../app.error";
import {wrap} from "@mikro-orm/core";

class ClientApplicationService {
    private static instance: ClientApplicationService;

    private constructor() {
        // Private constructor to prevent instantiation
    }

    public static getInstance(): ClientApplicationService {
        if (!ClientApplicationService.instance) {
        ClientApplicationService.instance = new ClientApplicationService();
        }
        return ClientApplicationService.instance;
    }

    async create(user: any, body: { name: string; description?: string; redirectUri: string }) {
        const db = await initORM()
        const userExists = await db.user.findOne({ id: user.id });
        if (!userExists) {
            throw new BadRequestError("You must be logged in to create a client application.");
        }
        const clientId = crypto.randomBytes(32).toString("hex");
        const clientSecret = crypto.randomBytes(32).toString("hex");
        const hashedClientSecret = await Bun.password.hash(clientSecret, "bcrypt");
        const clientApplication = db.clientApplication.create({
            name: body.name,
            description: body.description,
            redirectUri: body.redirectUri,
            clientId: clientId,
            clientSecret: hashedClientSecret,
            owner: userExists
        })

        await db.em.persistAndFlush(clientApplication);
        return {
            ...wrap(clientApplication).toObject(),
            clientSecret: clientSecret
        }
    }

    async findAll(user: any) {
        const db = await initORM()
        const userExists = await db.user.findOne({ id: user.id });
        if (!userExists) {
            throw new BadRequestError("You must be logged in to view client applications.");
        }
        return db.clientApplication.find({ owner: userExists });
    }

    async update(id: number, user: any, body: { name?: string; description?: string; redirectUri?: string }) {
        const db = await initORM()
        const userExists = await db.user.findOne({ id: user.id });
        if (!userExists) {
            throw new BadRequestError("You must be logged in to update a client application.");
        }
        const clientApplication = await db.clientApplication.findOne({ id, owner: userExists });
        if (!clientApplication) {
            throw new BadRequestError("Client application not found or you do not have permission to update it.");
        }
        if (body.name) clientApplication.name = body.name;
        if (body.description) clientApplication.description = body.description;
        if (body.redirectUri) clientApplication.redirectUri = body.redirectUri;

        await db.em.persistAndFlush(clientApplication);
        return clientApplication;
    }

    async delete(id: number, user: any) {
        const db = await initORM()
        const userExists = await db.user.findOne({ id: user.id });
        if (!userExists) {
            throw new BadRequestError("You must be logged in to delete a client application.");
        }
        const clientApplication = await db.clientApplication.findOne({ id, owner: userExists });
        if (!clientApplication) {
            throw new BadRequestError("Client application not found or you do not have permission to delete it.");
        }

        await db.em.removeAndFlush(clientApplication);
        return { message: "Client application deleted successfully." };
    }

    async updateClientSecret(id: number, user: any) {
        const db = await initORM()
        const userExists = await db.user.findOne({ id: user.id });
        if (!userExists) {
            throw new BadRequestError("You must be logged in to update the client secret.");
        }
        const clientApplication = await db.clientApplication.findOne({ id, owner: userExists });
        if (!clientApplication) {
            throw new BadRequestError("Client application not found or you do not have permission to update it.");
        }
        const newClientSecret = crypto.randomBytes(32).toString("hex");
        clientApplication.clientSecret = await Bun.password.hash(newClientSecret, "bcrypt")

        await db.em.persistAndFlush(clientApplication);
        return {
            ...wrap(clientApplication).toObject(),
            clientSecret: newClientSecret // Return the new client secret
        }
    }
}

export default ClientApplicationService;