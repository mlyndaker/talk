import { ApolloServerPlugin } from "@apollo/server";

import { markSeenCommentsBulk } from "coral-server/models/seenComments/seenComments";

import GraphContext from "../context";

export const CommentSeenServerPlugin: ApolloServerPlugin<GraphContext> = {
  async requestDidStart() {
    return {
      async willSendResponse({ contextValue: context }) {
        process.nextTick(() => {
          markSeenCommentsBulk(
            context.mongo,
            context.tenant.id,
            context.seenComments,
            context.now
          )
            .then((count) => {
              context.logger.debug(
                { inserted: count },
                "completed insertion of seenComments"
              );
            })
            .catch((error) => {
              context.logger.error(error);
            });
        });
      },
    };
  },
};
