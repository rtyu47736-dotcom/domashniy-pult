export async function onRequestPost({ request, env }) {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  const reply = (data, status=200) => new Response(JSON.stringify(data), { status, headers });
  let body;
  try { body = await request.json(); } catch { return reply({error:"Некорректный запрос"},400); }
  // Honeypot: bots fill this hidden field; respond as if accepted without sending.
  if (body.website) return reply({ok:true,emailSent:false});
  const allowed = ["Хочу чай","Хочу кофе","Хочу кушать","Хочу внимания","Открой окно","Закрой окно","Хочу сладкого"];
  if (!allowed.includes(body.action)) return reply({error:"Неизвестная просьба"},400);
  const comment = String(body.comment || "").trim().slice(0,500);
  const createdAt = new Date().toISOString();
  const id = crypto.randomUUID();
  try {
    await env.DB.prepare("INSERT INTO requests (id, action, comment, created_at) VALUES (?, ?, ?, ?)")
      .bind(id, body.action, comment, createdAt).run();
  } catch (e) { return reply({error:"Не удалось сохранить заявку"},500); }
  let emailSent = false;
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    const safe = s => s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    const html = `<h2>Новая просьба: ${safe(body.action)}</h2><p><b>Комментарий:</b> ${safe(comment || "Без комментария")}</p><p><b>Время:</b> ${createdAt}</p>`;
    try {
      const mail = await fetch("https://api.resend.com/emails", {
        method:"POST",
        headers:{"Authorization":`Bearer ${env.RESEND_API_KEY}`,"Content-Type":"application/json"},
        body:JSON.stringify({from:env.EMAIL_FROM,to:["cherniqa12@mail.ru"],subject:`Домашний пульт: ${body.action}`,html})
      });
      emailSent = mail.ok;
    } catch {}
  }
  return reply({ok:true,emailSent});
}