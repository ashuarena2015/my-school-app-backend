const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    branch: {
      type: String,
      required: function () {
        return this.kind === "UserRegister"; // only required if kind is 'UserRegister'
      },
    },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function () {
        return this.kind === "UserRegister"; // only required if kind is 'UserRegister'
      },
    },
    userId: { type: String, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    dob: { type: String },
    address: { type: String },
    userType: {
      type: String,
      required: function () {
        return this.kind === "UserRegister"; // only required if kind is 'UserRegister'
      },
    },
    phone: { type: Number },
    alternatePhone: { type: String },
    fatherName: { type: String },
    motherName: { type: String },
    class_current: { type: String },
    admission_class: { type: String },
    doa: { type: String },
    academic_session: { type: String },
    adminPermissions: { type: Array, default: [] },
    profilePhoto: { type: String },
    designation: { type: String },
    gender: { type: String },
    subjectInClass: { type: Array, default: [] },
    classTeacherOf: { type: String },
    verify_otp: {type: Number},
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true, discriminatorKey: "kind", collection: "users" },
);

// Base model
const User = mongoose.model("User", UserSchema);

// Discriminator model for registration (extends User)
const UserRegister = User.discriminator(
  "UserRegister",
  new mongoose.Schema(
    {
      email: { type: String, required: true, unique: true },
      // Password and branch is already handled in base schema with condition on `kind`
    },
    { _id: false } // Avoid duplicate _id field in discriminator
  )
);

module.exports = { User, UserRegister };
