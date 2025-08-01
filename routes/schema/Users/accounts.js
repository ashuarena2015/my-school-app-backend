const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true},
  },
  { timestamps: true, discriminatorKey: "kind" },
);

const AccountCreation = mongoose.model("Account", AccountSchema);

module.exports = { AccountCreation };
