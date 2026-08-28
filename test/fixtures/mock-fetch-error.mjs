globalThis.fetch = async () => new Response(
  "backend boom",
  {
    status: 503,
    statusText: "Service Unavailable",
  },
);
