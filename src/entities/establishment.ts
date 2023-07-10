import Employee from "./employee";
import State from "./state";

export class Establishment {
  id: string;
  name: string;
  state: State;
  employees: Map<string, Employee>;
  ticketsGenerated: number;

  constructor(id: string, name: string, state: State, employees: Map<string, Employee>, ticketsGenerated: number) {
    this.id = id;
    this.name = name;
    this.state = state;
    this.employees = employees;
    this.ticketsGenerated = ticketsGenerated;
  }

  get employees_clockedIn() {
    const clockedInEmployees = new Map<string, Employee>();

    this.employees.forEach((employee, employeeId) => {
      if (employee.clockedIn) {
        clockedInEmployees.set(employeeId, employee);
      }
    });

    return clockedInEmployees;
  }

  employees_batch(size: number): Map<string, Employee> {
    const arrayTemp = Array.from(this.employees).sort((e1, e2) => e1[1].lastClockIn.getTime() - e2[1].lastClockIn.getTime()).slice(0, size);

    return new Map(arrayTemp);
  }
}

export default Establishment;