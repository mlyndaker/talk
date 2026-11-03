// TypeScript 3.9 cannot parse the declarations bundled with webpack 5, so the
// build scripts are type checked against this minimal subset instead.
declare namespace webpack {
  type Configuration = Record<string, any>;
  interface WebpackPluginInstance {
    apply(compiler: any): void;
    [key: string]: any;
  }
  interface Compiler {
    hooks: any;
    run(callback: (err: Error | null, stats: any) => void): void;
    [key: string]: any;
  }
  type MultiCompiler = Compiler;
  class DefinePlugin implements WebpackPluginInstance {
    constructor(definitions: Record<string, any>);
    apply(compiler: any): void;
  }
}

declare function webpack(
  config: webpack.Configuration | webpack.Configuration[],
  callback?: (err: Error | null, stats: any) => void
): webpack.Compiler;

export = webpack;
