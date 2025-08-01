/* eslint-disable padding-line-between-statements */
/* eslint-disable import/order */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
const express = require('express');
const routerSchool = express.Router();
const path = require("path");
const { SchoolBranch } = require('./schema/School/school');

routerSchool.get("/branches", async (req, res) => {
    try {
        const response = await SchoolBranch.find({});
        console.log("Branches:", response);
        res.status(201).json({
            branches: response,
            message: "Branches fetched successfully",
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = { routerSchool };

