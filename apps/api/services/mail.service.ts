import { transporter } from "../lib/mailer.ts";

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: '"Lapince" <cherki.m3hdi@gmail.com>',
    to,
    subject: "Veuillez confirmez votre adresse email",
    html: `<p>Cliquez sur ce lien pour confirmer votre compte :</p>
           <a href="${link}">${link}</a>`,
  });
}
