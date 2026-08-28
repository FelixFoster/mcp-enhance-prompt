globalThis.fetch = async () => new Response(
  JSON.stringify({
    code: 0,
    msg: "success",
    data: {
      prompt: "enhanced prompt",
    },
  }),
  {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  },
);
