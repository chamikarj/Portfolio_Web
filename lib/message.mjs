const formResponseUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdkFOkY9ZJxecKDsEwKtx6etwk7qfvrall_nb6pefGxyCmdeQ/formResponse";
const headers = { "Cache-Control": "private, no-store" };
const error = (message, status) => Response.json({ status: "error", message }, { status, headers });
export async function POST(request, { secretKey = process.env.TURNSTILE_SECRET_KEY, fetchImpl = globalThis.fetch } = {}) {
    if (request.headers.get("origin") !== new URL(request.url).origin) {
        return error("Please use the contact form on this site.", 403);
    }
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
        return error("Please check the form and try again.", 415);
    }
    if (Number(request.headers.get("content-length") || 0) > 6000) {
        return error("Your message is too long.", 413);
    }
    let data;
    try {
        data = await request.json();
    }
    catch {
        return error("Please check the form and try again.", 400);
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return error("Please check the form and try again.", 400);
    }
    const fields = data;
    const name = typeof fields.name === "string" ? fields.name.trim() : "";
    const email = typeof fields.email === "string" ? fields.email.trim() : "";
    const message = typeof fields.message === "string" ? fields.message.trim() : "";
    const turnstileToken = typeof fields.turnstileToken === "string" ? fields.turnstileToken : "";
    if (!name || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120 || message.length < 10 || message.length > 2000) {
        return error("Please enter your name, a valid email, and a message of at least 10 characters.", 400);
    }
    if (!turnstileToken || turnstileToken.length > 2048) {
        return error("Please complete the human verification and try again.", 403);
    }
    const secret = secretKey;
    if (!secret) {
        return error("Message verification is temporarily unavailable. Please try again later.", 503);
    }
    try {
        const verification = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ secret, response: turnstileToken }),
            signal: AbortSignal.timeout(8000),
        });
        if (!verification.ok)
            throw new Error("Turnstile validation unavailable");
        const result = await verification.json();
        if (!result.success || result.action !== "contact_message" || result.hostname !== new URL(request.url).hostname) {
            return error("Human verification expired or failed. Please complete it again.", 403);
        }
    }
    catch {
        return error("We couldn't verify your message. Please try again later.", 502);
    }
    try {
        const upstream = await fetchImpl(formResponseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
            body: new URLSearchParams({
                "entry.574980307": name,
                "entry.1334678765": email,
                "entry.1588902554": message,
                fvv: "1",
                pageHistory: "0",
            }),
            redirect: "follow",
            signal: AbortSignal.timeout(20000),
        });
        const responsePage = await upstream.text();
        if (!upstream.ok || !responsePage.includes("Your response has been recorded")) {
            return error("The form did not confirm your message. Please try again later or email Chamika.", 502);
        }
        return Response.json({ status: "sent" }, { headers });
    }
    catch {
        return error("We couldn't confirm delivery. Please email Chamika if this is urgent; avoid resending immediately.", 502);
    }
}
