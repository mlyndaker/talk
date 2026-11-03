import { IResolvers } from "@graphql-tools/utils";

import attachDirectiveResolvers from "coral-server/graph/directives/attachDirectiveResolvers";
import auth from "coral-server/graph/directives/auth";
import applyConstraintDirective from "coral-server/graph/directives/constraint";
import rate from "coral-server/graph/directives/rate";
import resolvers from "coral-server/graph/resolvers";

import { loadSchema } from "../loadSchema";

export default function getSchema() {
  let schema = loadSchema(resolvers as IResolvers);

  // Attach the directive resolvers. `attachDirectiveResolvers` will return a
  // copy with the directives applied.
  schema = attachDirectiveResolvers(schema, { auth, rate });

  // Attach the constraint directive.
  schema = applyConstraintDirective(schema);

  return schema;
}
