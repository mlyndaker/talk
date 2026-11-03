import { getDirective, MapperKind, mapSchema } from "@graphql-tools/utils";
import { defaultFieldResolver, GraphQLSchema } from "graphql";
import { isFinite, isNumber } from "lodash";

export interface ConstraintDirectiveArgs {
  min?: number;
  max?: number;
}

function validate(value: any, { min, max }: ConstraintDirectiveArgs) {
  // If the value to validate is not a number, then we can't validate it!
  if (!isNumber(value)) {
    return;
  }

  // Ensure that the value is finite.
  if (!isFinite(value)) {
    throw new Error("not finite");
  }

  // Apply min validation.
  if (isNumber(min) && value < min) {
    throw new Error("too short");
  }

  // Apply max validation.
  if (isNumber(max) && value > max) {
    throw new Error("too long");
  }
}

/**
 * Applies the `@constraint` directive to field arguments, validating them
 * before the field is resolved.
 */
export default function applyConstraintDirective(schema: GraphQLSchema) {
  return mapSchema(schema, {
    [MapperKind.COMPOSITE_FIELD]: (fieldConfig) => {
      const constraints = Object.entries(fieldConfig.args || {})
        .map(([argName, argConfig]) => ({
          argName,
          args: getDirective(schema, argConfig, "constraint")?.[0] as
            | ConstraintDirectiveArgs
            | undefined,
        }))
        .filter(({ args }) => args);
      if (constraints.length === 0) {
        return fieldConfig;
      }

      const originalResolver = fieldConfig.resolve || defaultFieldResolver;
      return {
        ...fieldConfig,
        resolve(source, args, context, info) {
          for (const constraint of constraints) {
            validate(args[constraint.argName], constraint.args!);
          }

          return originalResolver(source, args, context, info);
        },
      };
    },
  });
}
