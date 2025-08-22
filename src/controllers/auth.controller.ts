import {Elysia, t} from "elysia";
import authMacro from "../macros/auth";
import {AuthService} from "../services/auth.service";

const authService = AuthService.getInstance();
const authController: Elysia = new Elysia()
    .group("/auth", group =>
        group
            .use(authMacro)
            .post("/register", async ({body}) => {
                return await authService.register(body)
            }, {
                detail: {
                    tags: ["Auth"],
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
                    tags: ["Auth"],
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
                    tags: ["Auth"],
                    security: [
                        {JwtAuth: []}
                    ],
                },
                query: t.Object({
                    clientId: t.String(),
                    scope: t.Optional(t.String()),
                })
            })
            .post("/login/google", async ({body}) => {
                return await authService.loginWithGoogle(body);
            }, {
                detail: {
                    tags: ["Auth"],
                },
                body: t.Object({
                    tokenId: t.String(),
                })
            })
            .post("/token", async ({body}) => {
                return await authService.exchangeCodeForToken(body.code, body.clientId, body.clientSecret);
            }, {
                detail: {
                    tags: ["Auth"],
                },
                body: t.Object({
                    code: t.String(),
                    clientId: t.String(),
                    clientSecret: t.String(),
                })
            })

    )

export default authController