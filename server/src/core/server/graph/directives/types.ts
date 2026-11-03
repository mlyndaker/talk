import { GraphQLResolveInfo } from "graphql";

export type DirectiveResolverFn<TSource = any, TContext = any> = (
  next: () => Promise<any>,
  source: TSource,
  args: any,
  context: TContext,
  info: GraphQLResolveInfo
) => any;
