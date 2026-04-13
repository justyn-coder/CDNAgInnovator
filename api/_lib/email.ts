import nodemailer from "nodemailer";

/**
 * Send an email via Gmail SMTP. No-ops if env vars are missing.
 * Reuse this for any notification (health alerts, feedback, etc).
 */
export async function sendEmail(opts: {
  subject: string;
  text: string;
  to?: string;
}): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = opts.to || process.env.NOTIFY_EMAIL;
  if (!user || !pass || !to) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `Trellis <${user}>`,
    to,
    subject: opts.subject,
    text: opts.text,
  });
}
