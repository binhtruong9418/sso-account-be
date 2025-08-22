import {Elysia, t} from "elysia";
import authMacro from "../macros/auth";
import {AuthService} from "../services/auth.service";

const authService = AuthService.getInstance();
const authController: Elysia = new Elysia()
    .group("/users", group =>
        group
            .use(authMacro)
            .post("/register", async ({body}) => {
                return await authService.register(body)
            }, {
                detail: {
                    tags: ["User"],
                },
                body: t.Object({
                    email: t.String(),
                    password: t.String(),
                })
            })
            .post("/login", async ({body, query}) => {
                return await authService.processLogin(body, query);
            }, {
                detail: {
                    tags: ["User"],
                },
                body: t.Object({
                    email: t.String(),
                    password: t.String(),
                }),
                query: t.Object({
                    clientId: t.Optional(t.String()),
                    scope: t.Optional(t.String()),
                })
            })
            .post("/login/oauth", async ({user, query}) => {
                return await authService.loginWithOauth(user.id, query);
            }, {
                checkAuth: ["user"],
                detail: {
                    tags: ["User"],
                    security: [
                        {JwtAuth: []}
                    ],
                },
                query: t.Object({
                    clientId: t.String(),
                    scope: t.Optional(t.String()),
                })
            })
            .post("/token", async ({body}) => {
                return await authService.exchangeCodeForToken(body.code, body.clientId, body.clientSecret);
            }, {
                detail: {
                    tags: ["User"],
                },
                body: t.Object({
                    code: t.String(),
                    clientId: t.String(),
                    clientSecret: t.String(),
                })
            })

    )

export default authController