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

}

export default Establishment;