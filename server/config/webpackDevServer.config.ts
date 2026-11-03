import fs from "fs";
import { IncomingMessage, ServerResponse } from "http";
import path from "path";
import errorOverlayMiddleware from "react-dev-utils/errorOverlayMiddleware";
import evalSourceMapMiddleware from "react-dev-utils/evalSourceMapMiddleware";
import ignoredFiles from "react-dev-utils/ignoredFiles";
import noopServiceWorkerMiddleware from "react-dev-utils/noopServiceWorkerMiddleware";
import WebpackDevServer, { Configuration } from "webpack-dev-server";

import paths from "./paths";

interface WebpackDevServerConfig {
  allowedHost: any;
  /** The port of the Coral server */
  serverPort: number;
  /** The port of the Webpack Dev server */
  devPort: number;
  publicPath: string;
}

export default function ({
  allowedHost,
  serverPort,
  devPort,
  publicPath,
}: WebpackDevServerConfig): Configuration {
  return {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers":
        "X-Requested-With, content-type, Authorization",
    },
    // Enable gzip compression of generated files.
    compress: true,
    // Serve the public folder and reload the page when it changes.
    static: {
      directory: paths.appPublic,
      watch: {
        ignored: ignoredFiles(paths.appSrc),
      },
    },
    // Enable hot reloading server.
    hot: true,
    client: {
      logging: "none",
      overlay: false,
      webSocketURL: {
        hostname: "127.0.0.1",
        port: devPort,
      },
    },
    devMiddleware: {
      publicPath,
      index: "embed.html",
      stats: "none",
    },
    historyApiFallback: {
      disableDotRule: true,
      rewrites: [],
    },
    allowedHosts: ["127.0.0.1"],
    proxy: [
      {
        context: "/api/graphql/live",
        target: `ws://localhost:${serverPort}`,
        ws: true,
      },
      {
        context: (pathname: string) => {
          const lc = pathname.toLocaleLowerCase();
          return [
            "/embed/auth",
            "/embed/bootstrap",
            "/admin",
            "/account",
            "/install",
            "/api",
            "/graphiql",
          ].some((p) => p === lc || lc.startsWith(`${p}/`));
        },
        target: `http://localhost:${serverPort}`,
        onError: (err: Error, req: IncomingMessage, res: ServerResponse) => {
          res.writeHead(500, {
            "Content-Type": "text/html",
          });
          res.end(
            fs.readFileSync(
              path.join(__dirname, "webpackDevServerProxyError.html")
            )
          );
          return;
        },
      },
    ],
    setupMiddlewares(middlewares: any[], devServer: WebpackDevServer) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      devServer.app!.use(evalSourceMapMiddleware(devServer));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      devServer.app!.use(errorOverlayMiddleware());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      devServer.app!.use(noopServiceWorkerMiddleware(publicPath));
      return middlewares;
    },
  };
}
