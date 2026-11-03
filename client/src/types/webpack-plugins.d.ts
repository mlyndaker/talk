// The webpack 5 compatible releases of these plugins don't ship type
// declarations, and their DefinitelyTyped packages target webpack 4.
declare module "case-sensitive-paths-webpack-plugin" {
  import { Compiler, WebpackPluginInstance } from "webpack";

  class CaseSensitivePathsPlugin implements WebpackPluginInstance {
    constructor(options?: { debug?: boolean });
    public apply(compiler: Compiler): void;
  }

  export = CaseSensitivePathsPlugin;
}

declare module "compression-webpack-plugin" {
  import { Compiler, WebpackPluginInstance } from "webpack";

  class CompressionPlugin implements WebpackPluginInstance {
    constructor(options?: Record<string, any>);
    public apply(compiler: Compiler): void;
  }

  export = CompressionPlugin;
}

declare module "webpack-assets-manifest" {
  import { Compiler, WebpackPluginInstance } from "webpack";

  class WebpackAssetsManifest implements WebpackPluginInstance {
    constructor(options?: Record<string, any>);
    public apply(compiler: Compiler): void;
  }

  export = WebpackAssetsManifest;
}
