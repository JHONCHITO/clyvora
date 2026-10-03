export function GET() {
  return Response.json({
    name: "Clyvora",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
