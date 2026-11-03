import {
  CacheHint,
  maybeCacheControlFromInfo,
} from "@apollo/cache-control-types";
import { GraphQLResolveInfo } from "graphql";

export function setCacheHint(
  info: GraphQLResolveInfo,
  cacheHint: CacheHint = { scope: "PRIVATE" }
) {
  const cacheControl = maybeCacheControlFromInfo(info);
  if (cacheControl) {
    cacheControl.setCacheHint(cacheHint);
  }
}
