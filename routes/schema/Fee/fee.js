const mongoose = require("mongoose");

const FeeUpdateSchema = new mongoose.Schema(
  {
    student_id: { type: String, required: true },
    payment_id: { type: String, required: true },
    amount_paid: { type: Number, required: true },
    payment_date: { type: String, required: true },
    fee_id: { type: String, required: true },
    fee_type: { type: String, required: true },
    payment_mode: { type: String, required: true },
    academic_session: { type: String, required: true },
    class: { type: String, required: true },
  }
);

const Fee = mongoose.model("feepayments", FeeUpdateSchema);

module.exports = Fee;
