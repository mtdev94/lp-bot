"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interactionCommands = exports.LP_MANAGEMENT = exports.LP_EMPLOYEE = void 0;
require("dotenv/config");
exports.LP_EMPLOYEE = {
    name: "invoke-employee",
    description: "Invoke the LP-Bot in an employee channel",
    type: 1,
};
exports.LP_MANAGEMENT = {
    name: "invoke-management",
    description: "Invoke the LP-Bot in a management channel",
    type: 1,
};
exports.interactionCommands = [exports.LP_EMPLOYEE, exports.LP_MANAGEMENT];
exports.default = exports.interactionCommands;
