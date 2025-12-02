// api/test.js
export const config = { runtime: "edge" };

export default function handler(request) {
  if (request.method !== "GET") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({ success: true, message: "Test working" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
