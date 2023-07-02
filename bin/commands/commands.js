"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const utils_1 = require("../utils");
const LP_EMPLOYEE = {
    name: "invoke-employee",
    description: "Invoke the LP-Bot in an employee channel",
    type: 1,
};
const LP_MANAGEMENT = {
    name: "invoke-management",
    description: "Invoke the LP-Bot in a management channel",
    type: 1,
};
const ALL_COMMANDS = [LP_EMPLOYEE, LP_MANAGEMENT];
(0, utils_1.InstallGlobalCommands)(process.env.APP_ID, ALL_COMMANDS);
