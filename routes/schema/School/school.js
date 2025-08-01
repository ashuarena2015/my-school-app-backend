const mongoose = require("mongoose");

const SchoolBranchSchema = new mongoose.Schema(
  {
    branch: { type: String, required: true },
  }
);

const SchoolClassesSchema = new mongoose.Schema(
  {
    classes: {
      key: { type: String, required: true },
      label: { type: String, required: true }
    },
  }
);

const SchoolSubjectsSchema = new mongoose.Schema(
  {
    subjectClass: [{
      subjects: { type: Array, required: true },
      classes: { type: Array, required: true }
    }],
  }
);

const SchoolSubjectClassTeacherSchema = new mongoose.Schema(
  {
    class: { type: String, unique: true },
    details: {
      teacher: { type: String, required: true },
      subject: { type: String, required: true }
    },
  }
);

const SchoolStudentAttendanceSchema = new mongoose.Schema(
  {
    class: { type: String },
    classTeacherIs: { type: String },
    date: { type: String },
    status: [{
      status: { type: String, required: true },
      studentId: { type: String, required: true },
      remarks: { type: String, required: true }
    }],
  }
);

const SchoolNotificationsSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
  }
);

const SchoolBranch = mongoose.model("branch", SchoolBranchSchema);
const SchoolClasses = mongoose.model("class", SchoolClassesSchema);
const SchoolSubjects = mongoose.model("subject", SchoolSubjectsSchema);
const SchoolSubjectClassTeacher = mongoose.model("subjectclassteacher", SchoolSubjectClassTeacherSchema);
const SchoolStudentAttendance = mongoose.model("studentattendance", SchoolStudentAttendanceSchema);
const SchoolNotifications = mongoose.model("notifications", SchoolNotificationsSchema);


module.exports ={ SchoolBranch, SchoolClasses, SchoolSubjects, SchoolSubjectClassTeacher, SchoolStudentAttendance, SchoolNotifications };
