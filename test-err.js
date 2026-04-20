const { registerUser } = require("./src/controllers/auth.controller.js");
const app = require("./src/app");
// Wait, I can just modify errorHandler.js to console.error(err.stack)
