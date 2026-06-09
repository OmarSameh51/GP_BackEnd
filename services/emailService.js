const brevo = require("@getbrevo/brevo");

const apiInstance = new brevo.TransactionalEmailsApi();

apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY,
);

const sendVerificationEmail = async (email, code) => {
  console.log("Sending email to:", email);

  try {
    const result = await apiInstance.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_USER,
        name: "Academic Advisor",
      },

      to: [
        {
          email: email,
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
    console.log(result);
  } catch (error) {
    console.error("BREVO ERROR:");
    console.error(error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
};
