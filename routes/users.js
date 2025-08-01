/* eslint-disable padding-line-between-statements */
/* eslint-disable import/order */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
const express = require('express');
const bcrypt = require("bcrypt");
const routerUsers = express.Router();
const jwt = require('jsonwebtoken');
const { verifyToken } = require('./isAuth');
const { User, UserRegister } = require('./schema/Users/user');
// const { AccountCreation } = require('./schema/Users/accounts');
const { AdminPermission, AdminRoles } = require('./schema/Users/permission');
const { SchoolBranch, SchoolClasses, SchoolSubjects, SchoolSubjectClassTeacher,
  SchoolStudentAttendance, SchoolNotifications } = require('./schema/School/school');

const fs = require('fs');
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const { verify } = require('crypto');
const nodemailer = require('nodemailer');

// const UserLogin = require('./schema/Users/userLogin');
// const UserRegister = require('./schema/Users/userRegister');

// Gmail app passoword: MailSender / cued eiag suuv ybzq

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ashuarena@gmail.com',
      pass: 'cued eiag suuv ybzq' // Use App Passwords, not your Gmail password
    }
  });

const isProd = process.env.NODE_ENV === 'production';

routerUsers.post("/", async (req, res) => {
    try {
        const { class_current, userAll, designation } = req.body;

        if (!class_current && !userAll) {
            return res.status(400).json({ error: "Class is required" });
        }

        let users = [];
        let students = [];

        if (userAll) {
            const query = designation ? { designation }
            : {
                designation: {
                    $nin: ['', null, ''],
                    $exists: true
                }
            };
            users = userAll !== 2 ? await User.find(query) : await User.find({}).select('name firstName lastName email profilePhoto designation');
        } else {
            // Get both students and non-students of a specific class
            const all = await User.find({ class_current })
                                  .populate("class_current"); // Adjust as needed
            // Separate them into users and students
            users = all.filter(u => u.userType !== "student");
            students = all.filter(u => u.userType === "student");
        }

        res.json({ users, students });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


routerUsers.get('/auth', verifyToken, async (req, res) => {
    try {
        const existingUser = await User.findOne({ email: req.user?.email });
        return res.status(200).json({ user: existingUser });
    } catch (error) {
        console.error("Auth error:", error);
        return res.status(403).json({ error: error?.message || 'Something went wrong' });
    }
});

// Generate Unique Student ID
// Generate Unique Student ID based on count
const generateUserId = async (designation) => {
    const count = await UserRegister.countDocuments();
    const nextId = count + 1;

    return designation === 'student'
        ? `STUDENT_${nextId}`
        : `ADMIN_${nextId}`;
};


routerUsers.post("/account", async (req, res) => {
    try {
      const { email, password, branch, userType, verifyOtp } = req.body.userInfo;
  
      if (!email || !password) {
        return res.status(400).send({ message: "Please provide correct credentials." });
      }
  
      const user = await User.findOne({ email });
      const otp = Math.floor(100000 + Math.random() * 900000);

      if (!user) {
  
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
  
        const newUser = new UserRegister({
          email,
          password: hashedPassword,
          branch,
          verify_otp: otp,
          isVerified: false,
          userId: await generateUserId(userType), // Generate unique ID
          userType,
          kind: "UserRegister", // ✅ required for discriminator
        });
  
        await newUser.save();

        await transporter.sendMail({
            from: '"Admin portal application" <ashuarena@gmail.com>',
            to: email,
            subject: 'Admin-Portal-App: Email Verification Code',
            text: `Your verification code is ${otp}`
        });
  
        return res.status(200).json({
          message: "Your account has been created.",
          user: {
            email: newUser.email,
            branch: newUser.branch,
            userId: newUser.userId,
            isVerified: newUser.isVerified,
          },
          isNewUser: true,
        });
      }

      if(verifyOtp) {
        const getUser = await User.findOne({ email, isVerified: false, verify_otp: verifyOtp });
        if(!getUser) {
          return res.status(400).send({ message: "Please provide correct OTP." });
        }
        const updatedUser = await User.findOneAndUpdate(
          { email },
          { isVerified: true, verify_otp: null },
          { new: true }
        );

        const token = jwt.sign(
            {
              userId: updatedUser._id,
              email: updatedUser.email,
            },
            "1234!@#%<{*&)",
            { expiresIn: "24h" }
          );
    
          res.cookie("auth", token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "None" : "Lax",
            maxAge: 24 * 60 * 60 * 1000,
            path: "/",
          });
    
          return res.status(201).json({ message: "You have been loggedIn!", user: updatedUser, token });
      }
  
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
  
        const token = jwt.sign(
          {
            userId: user._id,
            email: user.email,
          },
          "1234!@#%<{*&)",
          { expiresIn: "24h" }
        );
  
        res.cookie("auth", token, {
          httpOnly: true,
          secure: isProd,
          sameSite: isProd ? "None" : "Lax",
          maxAge: 24 * 60 * 60 * 1000,
          path: "/",
        });
  
        return res.status(201).json({ message: "You have been loggedIn!", user, token });
      } else {
        return res.status(401).send({ message: "Please provide correct password." });
      }
    } catch (error) {
      console.error("Error while creating user:", error);
      return res.status(500).json({ message: "Something went wrong.", error: error?.message });
    }
  });  

routerUsers.post("/register", async (req, res) => {
    try {
        const { password, email, designation, ...props } = req.body.userInfo;
        if (!password || !email) {
            return res.status(400).json({ error: "Name and Email are required" });
        }

        // 🔹 Hash the password with a salt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Generate Student ID
        const userId = await generateUserId(designation);
        // 🔹 Create and Save Student
        const newUser = new UserRegister({
            password: hashedPassword,
            email,
            userId,
            designation,
            ...props
        });
        await newUser.save();
        res.status(201).json({ message: "User saved!", user: newUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

routerUsers.post("/update", async (req, res) => {
    try {
        const { email: userEmail, ...props } = req.body.userInfo;
        if (!userEmail) {
            return res.status(400).json({ error: "Name and Email are required" });
        }
        

        // 🔹 Create and Save Student
        const newUser = await User.findOneAndUpdate(
            {
                email: userEmail
            },
            {
                ...props
            },
            { new: true, upsert: true } // Create if not found
        );
        res.status(201).json({ message: "User saved!", user: newUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

routerUsers.post('/login', async (req, res) => {

    try {
    
        const { email, password } = req.body.userInfo;

        if(!email || !password) {
            return res.status(400).send({message: 'Please provide correct credentials.'})
        }

        // Check If User Exists In The Database
        const user = await User.findOne({ email });
        // Compare Passwords
        const passwordMatch = await bcrypt.compare(password, user.password);

        if(!user || !passwordMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Generate JWT Token
        const token = jwt.sign({
            userId: user._id,
            email: user.email
        },
        "1234!@#%<{*&)",
        {
            expiresIn: "24h",
        });

        res.cookie("auth", token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "None" : "Lax",
            maxAge: 24 * 60 * 60 * 1000,
            path: "/"
          });

        return res
            .status(200)
            .json({
                message: "Login Successful",
                user,
                token
            });

    } catch (error) {
        res.send({error: error?.errmsg});
    }
    
});

// Multer config
const storage = multer.memoryStorage();
const upload = multer({ storage });

routerUsers.post("/upload-photo", upload.single("photo"), async (req, res) => {
    try {
      const { buffer, originalname } = req.file;
      const { userId } = req.query
      const filename = `${userId}-${originalname}`;
      const outputPath = path.join(__dirname, "../uploads", filename);
  
    //   // Crop and save
      await sharp(buffer)
        .resize({ width: 300, height: 300 }) // Optional: resize to fixed crop size
        .toFile(outputPath);
  
      // Optional: store path or metadata in MongoDB
      // await db.collection('images').insertOne({ path: outputPath, ... })
  
      const updatedUser = await User.findOneAndUpdate(
        { userId: userId },
        { $set: { profilePhoto: filename } },
        { new: true }
      );
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ message: "Image uploaded", path: filename, photoUrl: updatedUser.profilePhoto });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
});

routerUsers.get("/permissions", async (req, res) => {
    try {
        const permissions = await AdminPermission.find({});
        return res
            .status(200)
            .json({ permissions });
    } catch (error) {
        return res
            .status(403)
            .json({error: error?.errmsg});
    }
})

routerUsers.get("/adminInfo", async (req, res) => {
    try {
        const branches = await SchoolBranch.find({});
        const subjects = await SchoolSubjects.find({});
        const classes = await SchoolClasses.find({});
        const adminRoles = await AdminRoles.find({});
        const permissions = await AdminPermission.find({});
        
        const userCounter = await User.aggregate([
            {
              $match: {
                designation: { $ne: null, $ne: "", $exists: true }
              }
            },
            {
              $group: {
                _id: "$designation",
                count: { $sum: 1 }
              }
            }
        ]);

        const month = new Date().getMonth() + 1;
        const formattedMonth = month.toString().padStart(2, '0');

        const getBirthDayInMonth = await User.aggregate([
            {
              $addFields: {
                month: { $substr: ["$dob", 3, 2] }
              }
            },
            {
              $match: {
                month: formattedMonth
              }
            },
            {
                $project: {
                  firstName: 1,
                  lastName: 1,
                  class_current: 1,
                  profilePhoto: 1,
                  userType: 1,
                  designation: 1,
                  dob: 1,
                  _id: 0 // Exclude _id field if not needed
                }
            }
        ]);

        const counter = {};
        userCounter.forEach(({ _id, count }) => {
            const key = _id?.endsWith('s') ? _id : _id + 's';
            counter[key] = count;
        });

        res.json({
            permissions: permissions[0]?.permissions || [],
            counter,
            branches,
            adminRoles: adminRoles[0]?.roles || [],
            classes: classes[0]?.classes || [],
            subjects: subjects[0]?.subjectClass || [],
            getBirthDayInMonth,
        });

    } catch (error) {
        console.error("Error in /adminInfo:", error);
        res.status(500).json({ error: error.message });
    }
});

routerUsers.get("/notifications", async (req, res) => {
  try {
    const notifications = await SchoolNotifications.aggregate([
      // Step 1: Add a formatted string date (e.g., "2025-09-01")
      {
        $addFields: {
          dateOnly: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date" // assuming `date` is the timestamp field
            }
          }
        }
      },
      // Step 2: Sort all documents by date descending (latest messages first)
      {
        $sort: {
          date: -1
        }
      },
      // Step 3: Group by the string date
      {
        $group: {
          _id: "$dateOnly",
          messages: { $push: "$$ROOT" }
        }
      },
      {
        $sort: {
          dateAsDate: -1
        }
      }
    ]);
    
      return res
          .status(200)
          .json({ notifications });
  } catch (error) {
      return res
          .status(403)
          .json({error: error?.errmsg});
  }
})

routerUsers.route("/class-teacher")
    .post(async (req, res) => {
        try {
            const { class: selectedClass, classTeacherIs,  ...props } = req.body;
            const response = await SchoolSubjectClassTeacher.findOneAndUpdate(
                {
                    class: selectedClass
                },
                {
                    ...props
                },
                { new: true, upsert: true } // Create if not found
            );
            if(response && classTeacherIs) {
                await User.updateOne(
                    { classTeacherOf: selectedClass },
                    { $unset: { classTeacherOf: "" } } // or: { classTeacherOf: null }
                );
                await User.findOneAndUpdate(
                    { userId: classTeacherIs },
                    { classTeacherOf: selectedClass }
                );
            }
            res.status(201).json({ message: "Information saved!", response });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    })
    .get(async (req, res) => {
        try {
            const { class: selectedClass } = req.query;
            const response = await SchoolSubjectClassTeacher.find(
                {
                    class: selectedClass
                });
            res.status(201).json({ message: "Data fetched!", details: response[0]?.details });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

routerUsers.route("/attendance")
    .post(async (req, res) => {
        try {
            const { ...props } = req.body;

            const response = await SchoolStudentAttendance.findOneAndUpdate(
                {
                  class: props?.class,
                  date: props?.date
                },
                {
                  $set: { ...props }
                },
                {
                  new: true,      // Return the modified document
                  upsert: true,   // Create the document if it doesn't exist
                  setDefaultsOnInsert: true // Apply default values on insert
                }
            );              
            res.status(201).json({ message: "Attendance marked successfully!", attendanceInfo: [response] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    })
    .get(async (req, res) => {
        try {
            const { startDate, endDate, ...props } = req.query;
            
            const response = await SchoolStudentAttendance.find(
                {
                    class: "PP1-A",
                    date: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            );          
            res.status(201).json({ message: "Fetched successfully!", attendanceInfo: response });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    })

routerUsers.get("/logout", (req, res) => {
    res.clearCookie("auth", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      domain: "192.168.1.10", // <- required if it was set this way
      path: "/", // <- ensure it matches too
    });
    return res.json({ message: "Logged out successfully" });
});

routerUsers.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userType } = req.query;
        if (!id) {
            return res.status(400).json({ error: "Id is required" });
        }

        let userDetails = [];
        userDetails = await User.find({ userId: id });
        if(userDetails[0]?.userType === 'teacher') {
            userDetails = await SchoolSubjectClassTeacher.aggregate([
                {
                  $project: {
                    class: 1,
                    details: {
                      $filter: {
                        input: "$details",
                        as: "detail",
                        cond: { $eq: ["$$detail.teacher", id] }
                      }
                    }
                  }
                },
                {
                  $match: {
                    "details.0": { $exists: true }
                  }
                },
                { $unwind: "$details" },
                {
                  $lookup: {
                    from: "users",
                    localField: "details.teacher",
                    foreignField: "userId",
                    as: "teacherInfo"
                  }
                },
                { $unwind: "$teacherInfo" },
                {
                  $group: {
                    _id: "$details.teacher", // group by teacher ID
                    user: { $first: "$teacherInfo" },
                    subjects: {
                      $push: {
                        subject: "$details.subject",
                        class: "$class"
                      }
                    }
                  }
                }
            ]);  
        }

        const grouped = userDetails[0].subjects?.reduce((acc, curr) => {
            if (!acc[curr.class]) {
              acc[curr.class] = [];
            }
            acc[curr.class].push(curr.subject);
            return acc;
        }, {});

        res.json({user: userDetails[0]?.user ? userDetails[0]?.user : userDetails[0], subjectsTeach: grouped});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = { routerUsers };

