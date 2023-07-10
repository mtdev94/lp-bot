"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Establishment = void 0;
class Establishment {
    constructor(id, name, state, employees, ticketsGenerated) {
        this.id = id;
        this.name = name;
        this.state = state;
        this.employees = employees;
        this.ticketsGenerated = ticketsGenerated;
    }
    get employees_clockedIn() {
        const clockedInEmployees = new Map();
        this.employees.forEach((employee, employeeId) => {
            if (employee.clockedIn) {
                clockedInEmployees.set(employeeId, employee);
            }
        });
        return clockedInEmployees;
    }
}
exports.Establishment = Establishment;
exports.default = Establishment;
