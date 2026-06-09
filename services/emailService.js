const brevo = require("@getbrevo/brevo");

console.log("BREVO KEYS:");
console.log(Object.keys(brevo));

console.log("BREVO.Brevo KEYS:");
console.log(Object.keys(brevo.Brevo)); //test
console.log("transactionalEmails:");
console.log(brevo.Brevo.transactionalEmails);
module.exports = {};
