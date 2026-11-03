// TypeScript 3.9 cannot parse the declarations bundled with
// webpack-dev-server 5, so the dev server script is type checked against this
// minimal subset instead.
declare namespace WebpackDevServer {
  type Configuration = Record<string, any>;
}

declare class WebpackDevServer {
  constructor(options: WebpackDevServer.Configuration, compiler: any);
  public app?: any;
  public startCallback(callback: (err?: Error) => void): void;
  public stop(): Promise<void>;
}

export = WebpackDevServer;
