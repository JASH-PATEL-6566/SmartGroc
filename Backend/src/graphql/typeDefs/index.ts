import { mergeTypeDefs } from "@graphql-tools/merge";

import userTypeDefs from "./user.typeDefs";

const mergedTypeDefs = mergeTypeDefs([userTypeDefs]);

export default mergedTypeDefs;