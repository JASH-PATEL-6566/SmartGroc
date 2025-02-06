import express from "express";
import { ApolloServer } from "@apollo/server";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import dotenv from "dotenv";

import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolvers";
import connectDB from "./db/contectDB";

async function startServer() {
  dotenv.config();
  const app = express();

  const httpServer = http.createServer(app);

  const server: any = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  app.use(bodyParser.json());
  app.use(cors());

  await server.start();

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ req }),
    }) as any
  );

  await connectDB(); // Ensure database is connected before starting the server

  app.listen(process.env.PORT, () => {
    console.log(`Server ready at http://localhost:${process.env.PORT}/api`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
