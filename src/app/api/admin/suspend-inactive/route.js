export async function POST(req) {
  return new Response(
    JSON.stringify({ success: true, suspendedCount: 0 }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}


