import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

const fromAddress = env.SMTP_FROM?.includes("<")
  ? env.SMTP_FROM
  : env.SMTP_FROM
    ? `Tensae DMS <${env.SMTP_FROM}>`
    : env.SMTP_USER
      ? `Tensae DMS <${env.SMTP_USER}>`
      : undefined;

export const mailer = env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 465,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  : null;

export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}) {
  if (!mailer || !fromAddress) {
    throw new Error("SMTP is not configured");
  }

  return mailer.sendMail({
    from: fromAddress,
    to: input.to,
    replyTo: input.replyTo,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}