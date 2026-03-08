const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.isValidObjectId(id);

module.exports = isValidObjectId;