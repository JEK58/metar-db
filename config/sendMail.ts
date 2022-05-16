import nodemailer from "nodemailer";

const mailClient = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendMail(subject: string, text: string) {
  const message = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject,
    text,
    // html: "<p>HTML version of the message</p>"
  };
  try {
    await mailClient.sendMail(message);
    console.log("email sent");
  } catch (error) {
    console.log(error);
  }
}
