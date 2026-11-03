import { GraphQLSchema } from "graphql";

// @graphql-tools >= 12 typings can't be parsed by TypeScript 3.9, so declare
// the parts used by the test helpers here.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type IResolvers<TSource = any, TContext = any> = Record<string, any>;

export type IResolverValidationOptions = Record<string, any>;

const graphqlToolsSchema: {
  addResolversToSchema(options: {
    schema: GraphQLSchema;
    resolvers: IResolvers;
    resolverValidationOptions?: IResolverValidationOptions;
  }): GraphQLSchema;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
} = require("@graphql-tools/schema");

export const addResolversToSchema = graphqlToolsSchema.addResolversToSchema;
