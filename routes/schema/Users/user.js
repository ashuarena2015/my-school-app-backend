const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    branch: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function () {
        return this.kind === "UserRegister";
      },
    }, // Required only for registration
    userId: { type: String, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    dob: { type: String },
    address: { type: String },
    userType: { type: String },
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
    classTeacherOf: { type: String }
  },
  { timestamps: true, discriminatorKey: "kind" },
);

const User = mongoose.model("User", UserSchema);

// 🔹 Register Schema (Subset for /register)
const UserRegister = User.discriminator(
  "UserRegister",
  new mongoose.Schema(
    {
      email: { type: String, required: true },
      password: { type: String, required: true },
      designation: { type: String, required: true },
      branch: { type: String, required: true },
    }
  )
);

module.exports = { User, UserRegister };
