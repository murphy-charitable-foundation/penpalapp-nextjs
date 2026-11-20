import nodemailer from "nodemailer";

function validateEmailConfig() {
  const requiredEnvVars = [
    "PENPAL_EMAIL",
    "PENPAL_EMAIL_PASSWORD",
    "CPANEL_SMTP_HOST",
    "CPANEL_SMTP_PORT",
  ];

  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
  if (missingEnvVars.length > 0) {
    throw Object.assign(new Error(`Missing email environment variables: ${missingEnvVars.join(", ")}`), { code: "EMAIL_CONFIG" });
  }

  const smtpPort = Number(process.env.CPANEL_SMTP_PORT);
  if (Number.isNaN(smtpPort) || !Number.isInteger(smtpPort)) {
    throw Object.assign(new Error("CPANEL_SMTP_PORT must be a number."), { code: "EMAIL_CONFIG" });
  } else if (smtpPort <= 0 || smtpPort > 65535) {
    throw Object.assign(new Error("CPANEL_SMTP_PORT must be a valid port number (1-65535)."), { code: "EMAIL_CONFIG" });
  }
  return smtpPort;
}

export async function sendEmailMessage(mailOptions) {
  const smtpPort = validateEmailConfig();
  const transporter = nodemailer.createTransport({
    host: process.env.CPANEL_SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: process.env.PENPAL_EMAIL,
      pass: process.env.PENPAL_EMAIL_PASSWORD,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
    dnsTimeout: 10000,
  });

  return transporter.sendMail(mailOptions);
}
