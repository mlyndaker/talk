import fs from "fs";
import { buildSchema } from "graphql";
import path from "path";

import {
  addResolversToSchema,
  IResolvers,
  IResolverValidationOptions,
} from "./graphqlTools";

export function loadSchema(
  resolvers: IResolvers,
  options?: IResolverValidationOptions
) {
  const schema = buildSchema(
    fs.readFileSync(
      path.join(
        __dirname,
        "../../../../../../server/src/core/server/graph/schema/schema.graphql"
      ),
      "utf8"
    )
  );

  // Attach the resolvers to the schema.
  return addResolversToSchema({
    schema,
    resolvers,
    resolverValidationOptions: options,
  });
}
