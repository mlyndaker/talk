import { ApolloServerPlugin } from "@apollo/server";

import GraphContext from "../context";
import { enrichError, getFormattedErrors } from "./helpers";

export const ErrorApolloServerPlugin: ApolloServerPlugin<GraphContext> = {
  async requestDidStart() {
    return {
      async willSendResponse(requestContext) {
        const { contextValue: context } = requestContext;
        const errors = getFormattedErrors(requestContext);

        // If there's any errors on the response, we need to enrich their
        // extensions with translated messages.
        if (errors) {
          errors.forEach((err) => enrichError(context, err));
        }
      },
    };
  },
};

export default ErrorApolloServerPlugin;
