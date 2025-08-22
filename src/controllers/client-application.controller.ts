import {Elysia, t} from "elysia";
import authMacro from "../macros/auth";
import ClientApplicationService from "../services/client-application.service";

const clientApplicationService = ClientApplicationService.getInstance()
const clientApplicationController: any = new Elysia()
    .group("/client-application", group =>
        group
            .use(authMacro)
            .post("/", ({ body, user }) => {
                return clientApplicationService.create(user, body);
            }, {
                checkAuth: ["user"],
                detail: {
                    description: "Create a new client application",
                    tags: ["Client Application"],
                    security: [
                        {JwtAuth: []}
                    ],
                },
                body: t.Object({
                    name: t.String(),
                    description: t.Optional(t.String()),
                    redirectUri: t.String()
                })
            })
            .get("/", ({ user }) => {
                return clientApplicationService.findAll(user);
            }, {
                checkAuth: ["user"],
                detail: {
                    description: "Get all client applications for the authenticated user",
                    tags: ["Client Application"],
                    security: [
                        {JwtAuth: []}
                    ],
                }
            })
            .put("/:id", ({ body, user, params }) => {
                return clientApplicationService.update(params.id, user, body);
            }, {
                checkAuth: ["user"],
                detail: {
                    description: "Update a client application",
                    tags: ["Client Application"],
                    security: [
                        {JwtAuth: []}
                    ],
                },
                body: t.Object({
                    name: t.Optional(t.String()),
                    description: t.Optional(t.String()),
                    redirectUri: t.Optional(t.String())
                }),
                params: t.Object({
                    id: t.Number()
                })
            })
            .put("/:id/secret", ({ user, params }) => {
                return clientApplicationService.updateClientSecret(params.id, user);
            }, {
                checkAuth: ["user"],
                detail: {
                    description: "Update the client secret of a client application",
                    tags: ["Client Application"],
                    security: [
                        {JwtAuth: []}
                    ],
                },
                params: t.Object({
                    id: t.Number()
                })
            })
            .delete("/:id", ({ user, params }) => {
                return clientApplicationService.delete(params.id, user);
            }, {
                checkAuth: ["user"],
                detail: {
                    description: "Delete a client application",
                    tags: ["Client Application"],
                    security: [
                        {JwtAuth: []}
                    ],
                },
                params: t.Object({
                    id: t.Number()
                })
            })
    )

export default clientApplicationController;