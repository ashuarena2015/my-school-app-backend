/* eslint-disable padding-line-between-statements */
/* eslint-disable import/order */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
const express = require('express');
const routerSchool = express.Router();
const path = require("path");
const SchoolBranch = require('./schema/School/school');

routerSchool.get("/branches", async (req, res) => {
    try {
        const response = await SchoolBranch.find({});
        res.status(201).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = { routerSchool };

