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

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: '"Lapince" <cherki.m3hdi@gmail.com>',
    to,
    subject: "Réinitialisation de votre mot de passe",
    html: `<p>Vous avez demandé à réinitialiser votre mot de passe La Pince.</p>
           <p>Ce lien est valable 30 minutes et ne fonctionne qu'une fois :</p>
           <a href="${link}">${link}</a>
           <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe reste inchangé.</p>`,
  });
}
