#!/usr/bin/env node
import { createOblioMcpServer } from "./mcpServer.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getConfig } from "./config.js";

// Main function to start the server
const startServer = async () => {
  try {
    // Validate environment configuration early
    const config = getConfig();

    // Create the MCP server with config
    const server = createOblioMcpServer(config);

    // Create a stdio transport for command line usage
    const transport = new StdioServerTransport();

    await server.connect(transport);
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

startServer().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
