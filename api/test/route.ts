// api/test/route.js

export function GET() {
  return new Response(
    JSON.stringify({ success: true, message: "Test working" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
