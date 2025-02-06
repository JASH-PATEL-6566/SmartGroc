import { mergeResolvers } from "@graphql-tools/merge";

import { UserResolver } from "./user.res";

const mergedResolver = mergeResolvers([UserResolver]);

export default mergedResolver;
