#!/usr/bin/env node

import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {getAuthValue, getParamValue} from "@chatmcp/sdk/utils/index.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import {CallToolRequestSchema, ListToolsRequestSchema,} from "@modelcontextprotocol/sdk/types.js";
import {RestServerTransport} from "@chatmcp/sdk/server/rest.js";

const promptPilotApiKey = getParamValue("prompt_pilot_api_key");
const mode = getParamValue("mode") || "stdio";
const port = getParamValue("port") || 9593;
const endpoint = getParamValue("endpoint") || "/rest";
import { z } from 'zod';
const server = new Server(
  {
    name: "enhance-prompt",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const ResponseBodySchema = z.object({
  code: z.number(),
  msg: z.string(),
  data: z.object({
    prompt: z.string(),
  }),
});
type ResponseBody = z.infer<typeof ResponseBodySchema>;
/**
 * Handler that lists available tools.
 * Exposes a single "write_note" tool that lets clients create new notes.
 */
server.setRequestHandler(ListToolsRequestSchema, async (request) => {
  return {
    tools: [
      {
        name: "enhance_prompt",
        description: "Accepts a simple keyword, phrase, or initial brief prompt and enhances it into a detailed, high-quality prompt. This tool elevates minimal input by adding structure, context, and specificity, transforming basic ideas into effective prompts optimized for generating better and more predictable results from AI models.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "your prompt",
            },
          },
          required: ["prompt"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.log("request", request);
  const apiKey = promptPilotApiKey || getAuthValue(request, "PROMPT_PILOT_API_KEY");
  const prompt = String(request.params.arguments?.prompt);
  const url = "https://promptpilot.online/api/mcp";
  const body = { input: prompt };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unable to parse error response");
      throw new Error(`Prompt Pilot API error: ${response.status} ${response.statusText}\n${errorText}`);
    }
    console.log("response", response);
    const rawJson = await response.json();
    const responseJson:ResponseBody = ResponseBodySchema.parse(rawJson);

    if (responseJson.code !== 0) {
      throw new Error(`Unexpected response from Prompt Pilot API: ${responseJson.msg}`);
    }

    return {
      content: [{ type: "text", text: responseJson.data.prompt }],
      isError: false,
    };

  } catch (error) {
    console.error("Error calling Prompt Pilot API:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});



/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  // console.log(`Starting server in ${mode} mode...`);
  if (mode === "rest") {
    const transport = new RestServerTransport({
      port,
      endpoint,
    });
    console.log(`Server start on port ${port}${endpoint}`);
    await server.connect(transport);
    await transport.startServer();
    console.log(`Server started on port ${port}${endpoint}`);
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // console.log("Server started");
  }
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});