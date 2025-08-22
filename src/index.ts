import {Elysia} from "elysia";
import {RequestContext} from "@mikro-orm/core";
import {swagger} from '@elysiajs/swagger'
import {cors} from '@elysiajs/cors'
import {opentelemetry} from '@elysiajs/opentelemetry'
import responseMiddleware from "./middlewares/response.middleware";
import errorMiddleware from "./middlewares/error.middleware";
import { initORM } from "./db";
import authController from "./controllers/auth.controller";
import clientApplicationController from "./controllers/client-application.controller";

const startApp = async () => {
  try {
    const dataSource = await initORM()
    //sync entities classes to database
    await dataSource.orm.getSchemaGenerator().updateSchema();

    const app = new Elysia()
        .use(cors())
        .onError(errorMiddleware)
        .get("/", () => "It's works!")
        .use(swagger(
            {
              path: '/swagger-ui',
              provider: 'swagger-ui',
              documentation: {
                info: {
                  title: 'Elysia template v3',
                  description: 'Elysia template API Documentation',
                  version: '1.0.3',
                },
                components: {
                  securitySchemes: {
                    JwtAuth: {
                      type: 'http',
                      scheme: 'bearer',
                      bearerFormat: 'JWT',
                      description: 'Enter JWT Bearer token **_only_**'
                    }
                  }
                },
              },
              swaggerOptions: {
                persistAuthorization: true,
              }
            }
        ))
        .onBeforeHandle(() => RequestContext.enter(dataSource.em))
        .onAfterHandle(responseMiddleware)
        .use(opentelemetry())
        .group("/api", group =>
            group
                .use(clientApplicationController)
                .use(authController)
        )
        .listen(3000);
    console.log(
        `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
    );
    console.log(
        `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}/swagger-ui`
    );
  } catch (err) {
    console.error(err)
  }
}
startApp().then()

