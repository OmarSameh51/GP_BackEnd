const axios = require("axios");

const sendVerificationEmail = async (email, code) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "GP System",
          email: process.env.EMAIL_USER,
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
      },
      {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
      },
    );

    console.log("Email sent:", response.data);
  } catch (error) {
    console.error("Brevo Error:", error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
};
