/**
 * Evaluates the output of the previous loaders (e.g. css-loader) and returns
 * it as a plain string, so it can be emitted with file-loader.
 *
 * Based on extract-loader (MIT, https://github.com/peerigon/extract-loader),
 * which pins the vulnerable babel 6 toolchain.
 */
const babel = require("@babel/core");
const path = require("path");
const resolve = require("resolve");
const vm = require("vm");

function rndNumber() {
  return Math.random().toString().slice(2);
}

function getPublicPath(options, loaderContext) {
  if ("publicPath" in options) {
    return typeof options.publicPath === "function"
      ? options.publicPath(loaderContext)
      : options.publicPath;
  }
  const publicPath =
    loaderContext._compilation &&
    loaderContext._compilation.outputOptions.publicPath;
  return typeof publicPath === "string" && publicPath !== "auto"
    ? publicPath
    : "";
}

function extractExports(exports) {
  if (exports && exports.__esModule && "default" in exports) {
    exports = exports.default;
  }
  return exports.toString();
}

function evalDependencyGraph({ loaderContext, src, filename, publicPath }) {
  const moduleCache = new Map();

  function loadModule(request) {
    return new Promise((res, rej) => {
      loaderContext.loadModule(request, (err, source) =>
        err ? rej(err) : res(source)
      );
    });
  }

  async function evalModule(source, file) {
    const placeholder = `__EXTRACT_LOADER_PLACEHOLDER__${rndNumber()}${rndNumber()}`;
    const placeholderPattern = new RegExp(`${placeholder}(\\d+)__`, "g");
    const dependencies = [];

    const { code } = babel.transformSync(source, {
      babelrc: false,
      configFile: false,
      filename: file,
      plugins: [require.resolve("@babel/plugin-transform-modules-commonjs")],
    });

    const exports = {};
    const sandbox = {
      ...global,
      module: { exports, id: file },
      exports,
      __webpack_public_path__: publicPath,
      require: (request) => {
        const queryIndex =
          request.indexOf("?") === -1 ? request.length : request.indexOf("?");
        const withoutQuery = request.slice(0, queryIndex);
        const query = request.slice(queryIndex);
        const loaderIndex = withoutQuery.lastIndexOf("!");
        const loaders = withoutQuery.slice(0, loaderIndex + 1);
        const relativePath = withoutQuery.slice(loaderIndex + 1);
        const absolutePath = resolve.sync(relativePath, {
          basedir: path.dirname(file),
        });

        if (loaders === "" && path.extname(absolutePath) === ".js") {
          loaderContext.addDependency(absolutePath);
          return require(absolutePath);
        }

        dependencies.push({
          absolutePath,
          request: loaders + absolutePath + query,
        });
        return `${placeholder}${dependencies.length - 1}__`;
      },
    };

    new vm.Script(code, {
      filename: file,
      displayErrors: true,
    }).runInNewContext(sandbox);

    const contents = await Promise.all(
      dependencies.map(async ({ absolutePath, request }) => {
        if (moduleCache.has(request)) {
          return moduleCache.get(request);
        }
        const content = await evalModule(
          await loadModule(request),
          absolutePath
        );
        moduleCache.set(request, content);
        return content;
      })
    );

    return extractExports(sandbox.module.exports).replace(
      placeholderPattern,
      (_, index) => contents[Number(index)]
    );
  }

  return evalModule(src, filename);
}

module.exports = function extractLoader(src) {
  const done = this.async();
  const options = (this.getOptions ? this.getOptions() : this.query) || {};
  this.cacheable();

  evalDependencyGraph({
    loaderContext: this,
    src,
    filename: this.resourcePath,
    publicPath: getPublicPath(typeof options === "object" ? options : {}, this),
  }).then((content) => done(null, content), done);
};
