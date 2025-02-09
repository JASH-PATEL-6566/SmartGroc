import { mergeTypeDefs } from "@graphql-tools/merge";

import userTypeDefs from "./user.typeDefs.js";

const mergedTypeDefs = mergeTypeDefs([userTypeDefs]);

export default mergedTypeDefs;