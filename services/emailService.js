const brevo = require("@getbrevo/brevo");

console.log("BREVO OBJECT:");
console.log(brevo);

const sendVerificationEmail = async () => {
  console.log("TEST");
};

module.exports = {
  sendVerificationEmail,
};
