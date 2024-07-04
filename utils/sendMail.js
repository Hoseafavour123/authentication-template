import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({
  path: "config/.env",
});


const sendMail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    service: process.env.SMTP_SERVICE,
    auth: {
      user: "inioluwa5555@gmail.com",
      pass: "ofzoxskfznawdukd",
    },
    tls: {rejectUnauthorized: false}
  });

  const mailOptions = {
    from: `"Appointment App" <inioluwa5555@gmail.com>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendMail;
