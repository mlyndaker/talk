import { addResolversToSchema } from "@graphql-tools/schema";
import { IResolvers, IResolverValidationOptions } from "@graphql-tools/utils";
import fs from "fs";
import { buildSchema } from "graphql";
import path from "path";

export function loadSchema(
  resolvers: IResolvers,
  options?: IResolverValidationOptions
) {
  const schema = buildSchema(
    fs.readFileSync(path.join(__dirname, "schema/schema.graphql"), "utf8")
  );

  // Attach the resolvers to the schema.
  return addResolversToSchema({
    schema,
    resolvers,
    resolverValidationOptions: options,
  });
}
