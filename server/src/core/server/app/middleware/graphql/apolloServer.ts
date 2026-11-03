import { ApolloServer, ApolloServerPlugin } from "@apollo/server";
import ResponseCachePlugin from "@apollo/server-plugin-response-cache";
import { ApolloServerPluginCacheControl } from "@apollo/server/plugin/cacheControl";
import { ApolloServerPluginCacheControlDisabled } from "@apollo/server/plugin/disabled";
import { expressMiddleware } from "@as-integrations/express4";
import { RequestHandler, Router } from "express";

import { CLIENT_ID_HEADER } from "coral-common/common/lib/constants";
import { AppOptions } from "coral-server/app";
import GraphContext, { GraphContextOptions } from "coral-server/graph/context";
import {
  CommentSeenServerPlugin,
  ErrorApolloServerPlugin,
  LoggerApolloServerPlugin,
  MetricsApolloServerPlugin,
} from "coral-server/graph/plugins";
import rootLogger from "coral-server/logger";
import { Request, TenantCoralRequest } from "coral-server/types/express";

import { RedisCache } from "./cache/redis";

type ContextProviderOptions = Omit<AppOptions, "schema" | "metrics">;

function contextProvider(options: ContextProviderOptions) {
  return async ({ req }: { req: Request<TenantCoralRequest> }) => {
    // Grab the details from the Coral request.
    const { id, now, tenant, site, logger, persisted } = req.coral;

    // Create some new options to store the tenant context details inside.
    const opts: GraphContextOptions = {
      ...options,
      id,
      now,
      req,
      persisted,
      tenant,
      logger,
      site,
    };

    // Add the user if there is one.
    if (req.user) {
      opts.user = req.user;
    }

    // Add the clientID if there is one on the request.
    const clientID = req.get(CLIENT_ID_HEADER);
    if (clientID) {
      // Limit the clientID to 36 characters (the length of a UUID).
      opts.clientID = clientID.slice(0, 36);
    }

    // Return the compiled context.
    return new GraphContext(opts);
  };
}

export const apolloGraphQLMiddleware = ({
  schema,
  metrics,
  ...options
}: AppOptions) => {
  const plugins: Array<ApolloServerPlugin<GraphContext>> = [
    ErrorApolloServerPlugin,
    LoggerApolloServerPlugin,
    MetricsApolloServerPlugin(metrics),
    CommentSeenServerPlugin,
  ];

  // Cache headers are only calculated when enabled.
  if (options.config.get("graphql_cache_headers")) {
    plugins.push(
      ApolloServerPluginCacheControl({
        defaultMaxAge: Math.floor(
          options.config.get("default_graphql_cache_max_age") / 1000
        ),
      })
    );

    if (options.config.get("graphql_response_cache")) {
      plugins.push(
        ResponseCachePlugin<GraphContext>({
          sessionId: async ({ contextValue }) =>
            contextValue.user ? contextValue.user.id : null,
          cache: new RedisCache(options.redis),
        })
      );
    }
  } else {
    plugins.push(ApolloServerPluginCacheControlDisabled());
  }

  const server = new ApolloServer<GraphContext>({
    schema,
    introspection:
      options.config.get("env") !== "production" ||
      options.config.get("enable_graphiql"),
    persistedQueries: false,
    // CORS and authentication are handled by the preceding middleware.
    csrfPrevention: false,
    includeStacktraceInErrorResponses: false,
    plugins,
  });

  const context = contextProvider(options);

  // The server must be started before the middleware can handle requests.
  const ready = server.start().then(() =>
    expressMiddleware(server, {
      context: ({ req }) =>
        context({ req: req as Request<TenantCoralRequest> }),
    })
  );
  ready.catch((err) => {
    rootLogger.error({ err }, "could not start the graphql server");
  });

  const handler: RequestHandler = (req, res, next) => {
    ready.then((middleware) => middleware(req, res, next), next);
  };

  const router = Router();
  router.use("/graphql", handler);

  return router;
};
