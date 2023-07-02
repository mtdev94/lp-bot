"use strict";
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
var State;
(function (State) {
    State[State["open"] = 0] = "open";
    State[State["closed"] = 1] = "closed";
})(State || (State = {}));
