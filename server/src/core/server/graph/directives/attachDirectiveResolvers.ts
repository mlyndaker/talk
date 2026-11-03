import { getDirective, MapperKind, mapSchema } from "@graphql-tools/utils";
import { defaultFieldResolver, GraphQLSchema } from "graphql";

import { DirectiveResolverFn } from "./types";

/**
 * Wraps the resolvers of fields annotated with one of the given directives so
 * the directive resolver runs first, in the order the directives are applied.
 */
export default function attachDirectiveResolvers(
  schema: GraphQLSchema,
  directiveResolvers: Record<string, DirectiveResolverFn>
) {
  return mapSchema(schema, {
    [MapperKind.COMPOSITE_FIELD]: (fieldConfig) => {
      const directives = (fieldConfig.astNode?.directives || [])
        .map((node) => node.name.value)
        .filter((name) => directiveResolvers[name]);
      if (directives.length === 0) {
        return fieldConfig;
      }

      let resolve = fieldConfig.resolve || defaultFieldResolver;
      for (const name of directives) {
        const directiveArgs = getDirective(schema, fieldConfig, name)?.[0];
        const directiveResolver = directiveResolvers[name];
        const originalResolver = resolve;
        resolve = (source, args, context, info) =>
          directiveResolver(
            () =>
              new Promise((res) =>
                res(originalResolver(source, args, context, info))
              ),
            source,
            directiveArgs,
            context,
            info
          );
      }

      return { ...fieldConfig, resolve };
    },
  });
}
