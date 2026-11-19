export async function onRequestPost({ request, env }) {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  const reply = (data, status = 200) =>
    new Response(JSON.stringify(data), { status, headers });

  let body;
  try {
    body = await request.json();
  } catch {
    return reply({ error: "Некорректный запрос" }, 400);
  }

  // Honeypot: bots fill this hidden field; silently accept without sending.
  if (body.website) return reply({ ok: true, emailSent: false });

  const allowed = [
    "Хочу чай", "Хочу кофе", "Хочу кушать", "Хочу внимания",
    "Открой окно", "Закрой окно", "Хочу сладкого",
    "18+", "Гулять", "Сходить в магазин"
  ];
  const destinations = ["Ozon", "Wildberries", "аптеку", "Пятёрочку", "жопу"];
  const validDestination = destinations.some(place => body.action === `Отправить мужа в ${place}`);
  if (!allowed.includes(body.action) && !validDestination) {
    return reply({ error: "Неизвестная просьба" }, 400);
  }

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return reply({
      error: "Почта ещё не настроена. Заявка не отправлена."
    }, 503);
  }

  const comment = String(body.comment || "").trim().slice(0, 500);
  const createdAt = new Date().toLocaleString("ru-RU", {
    timeZone: "Asia/Krasnoyarsk"
  });

  const safe = value => String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  }[char]));

  const html = `
    <div style="font-family:Arial,sans-serif;color:#493a40">
      <h2>Новая просьба: ${safe(body.action)}</h2>
      <p><b>Комментарий:</b> ${safe(comment || "Без комментария")}</p>
      <p><b>Время:</b> ${safe(createdAt)} (Красноярск)</p>
    </div>
  `;

  try {
    const mail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: ["rtyu47736@gmail.com"],
        subject: `Домашний пульт: ${body.action}`,
        html
      })
    });

    if (!mail.ok) {
      const details = await mail.text();
      console.error("Resend error:", mail.status, details);
      return reply({ error: "Почтовый сервис не принял письмо. Попробуй позже." }, 502);
    }

    return reply({ ok: true, emailSent: true });
  } catch (error) {
    console.error("Email request failed:", error);
    return reply({ error: "Не удалось связаться с почтовым сервисом." }, 502);
  }
}
