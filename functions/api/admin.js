export async function onRequestGet({ request, env }) {
  const headers = { "Content-Type":"application/json", "Cache-Control":"no-store" };
  const reply = (data,status=200) => new Response(JSON.stringify(data),{status,headers});
  const auth = request.headers.get("Authorization") || "";
  if (!env.ADMIN_PASSWORD || auth !== `Bearer ${env.ADMIN_PASSWORD}`) return reply({error:"Неверный пароль"},401);
  try {
    const { results } = await env.DB.prepare("SELECT action, comment, created_at FROM requests ORDER BY created_at DESC LIMIT 100").all();
    return reply({requests:results});
  } catch { return reply({error:"Не удалось прочитать историю"},500); }
}