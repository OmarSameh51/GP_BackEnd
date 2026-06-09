const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP ERROR:");
    console.error(error);
  } else {
    console.log("SMTP READY");
  }
});
const sendVerificationEmail = async (email, code) => {
  console.log("Sending email to:", email);
  console.log("BREVO_USER:", process.env.BREVO_USER);
  console.log("EMAIL_USER:", process.env.EMAIL_USER);

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email",
    html: `
      <h2>Email Verification</h2>
      <p>Your verification code is:</p>
      <h1>${code}</h1>
      <p>This code expires in 10 minutes.</p>
    `,
  });

  console.log("Email sent successfully");
};

module.exports = {
  sendVerificationEmail,
};
