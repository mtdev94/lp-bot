import { User } from "discord.js";
import { Establishment } from "./entities/establishment";
import Employee from "./entities/employee";
import State from "./entities/state";

export class LpRunner {
  onEvent: (event: string) => void;
  establishment: Establishment;
  maxEmployees: number;
  ticketThreshold: number = parseInt(process.env.TIME_THRESHOLD ?? "150") || 150;
  timer?: NodeJS.Timer;

  constructor(establishment: Establishment, maxEmployees: number, callback: (event: string) => void) {
    this.establishment = establishment;
    this.onEvent = callback;
    this.maxEmployees = maxEmployees;
  }

  OpenLP() {
    console.log("Opening LP");
    this.establishment.ticketsGenerated = 0;
    this.establishment.state = State.open;
    this.establishment.employees.forEach((employee) => {
      employee.tickets = 0;
      employee.timeElapsed = 0;
    });

    this.StartTimer();
    this.onEvent("open_lp");
  }

  CloseLP() {
    console.log("Closing LP");

    this.establishment.state = State.closed;
    this.establishment.employees.forEach((employee) => {
      employee.clockedIn = false;
    });

    this.StopTimer();
    this.onEvent("close_lp");
  }

  HandleClockInButton(user: User) {
    if (this.establishment.state == State.closed ||
      this.establishment.employees_clockedIn.size >= this.maxEmployees ||
      this.establishment.employees_clockedIn.get(user.id)) { return; }

    const employee = this.establishment.employees.get(user.id);

    if (employee) {
      employee.lastClockIn = new Date();
      employee.clockedIn = true;
    } else {
      this.establishment.employees.set(user.id, new Employee(user.id, new Date(), user.username, true, 0, new Date()));
    }

    console.log(`${user.id} is now clocked in`);
    this.onEvent("clockEmployeeIn");
  }

  ClockEmployeeOut(user: User) {
    if (this.establishment.state == State.closed || this.establishment.employees.get(user.id) == null) {
      return
    }

    const employee = this.establishment.employees.get(user.id);
    if (employee) {
      employee.clockedIn = false;
    }

    console.log(`${user.id} is now clocked out`);
    console.log(this.establishment.employees);
    this.onEvent("clockEmployeeOut");
  }

  StartTimer() {
    this.timer = setInterval(() => {
      this.HandleTimer();
    }, 1000);
  }

  StopTimer() {
    clearInterval(this.timer);
  }

  HandleTimer() {
    if (this.establishment.state == State.closed) {
      return;
    }

    this.establishment.employees.forEach((employee, employeeId) => {
      if (!employee.clockedIn) {
        return;
      }

      employee.timeElapsed = Math.floor(Math.abs(Date.now() - employee.lastClockIn.getTime()) / 60000);


      const elapsedTime = Math.abs(Date.now() - employee.lastTicket.getTime()); // Calculate elapsed time in milliseconds
      const seconds = Math.floor(elapsedTime / 1000);
      const minutes = Math.floor(seconds / 60);

      if (seconds >= this.ticketThreshold) {
        this.establishment.ticketsGenerated += 1;
        employee.tickets += 1;
        employee.lastTicket = new Date(); // Update the timestamp for the last checked-in time

        console.log(
          `Employee ${employee.username} (${employeeId}) earned 1 ticket`
        );
        console.log(
          `Total tickets for ${employee.username}: ${employee.tickets}`
        );
        this.onEvent("handleTimer");
      }
    });
  }
}

export default LpRunner;