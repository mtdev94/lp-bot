"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Employee = void 0;
class Employee {
    constructor(id, lastClockIn, username, clockedIn, tickets, lastTicket) {
        this.id = id;
        this.lastClockIn = lastClockIn;
        this.username = username;
        this.clockedIn = clockedIn;
        this.tickets = tickets;
        this.lastTicket = lastTicket;
    }
}
exports.Employee = Employee;
exports.default = Employee;
