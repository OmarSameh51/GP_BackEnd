const brevo = require("@getbrevo/brevo");

const client = new brevo.Brevo({
  apiKey: process.env.BREVO_API_KEY,
});

const sendVerificationEmail = async (email, code) => {
  try {
    console.log("Sending email to:", email);

    await client.transactionalEmails.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_USER,
        name: "Academic Advisor",
      },

      to: [
        {
          email,
        },
      ],

      subject: "Verify Your Email",

      htmlContent: `
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <h1>${code}</h1>
        <p>This code expires in 10 minutes.</p>
      `,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("BREVO ERROR:");
    console.error(error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
};
