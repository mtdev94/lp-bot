export class LpRunner {
  callback;
  is_open = false;
  employees = new Map();
  ticketsGenerated = 0;
  maxEmployees = 3;
  timer;

  get employees_clockedIn() {
    const clockedInEmployees = new Map();

    this.employees.forEach((employee, employeeId) => {
      if (employee.clocked_in) {
        clockedInEmployees.set(employeeId, employee);
      }
    });

    return clockedInEmployees;
  }

  constructor(callback) {
    this.callback = callback;
  }

  open_lp() {
    console.log("Opening LP");
    this.ticketsGenerated = 0;
    this.is_open = true;

    this.startTimer();
    this.callback("open_lp");
  }

  close_lp() {
    console.log("Closing LP");

    this.is_open = false;
    this.employees.forEach((employee, employeeId) => {
      employee.clocked_in = false;
    });

    this.stopTimer();
    this.callback("close_lp");
  }

  clockEmployeeIn(employee) {
    if (
      !this.is_open ||
      this.employees_clockedIn.size >= this.maxEmployees ||
      this.employees_clockedIn.get(employee.id)
    ) {
      return;
    }

    var currentdate = new Date();
    this.employees.set(employee.id, {
      date: currentdate,
      username: employee.username,
      tickets: 0,
      time_elapsed: 0,
      last_ticket: currentdate,
      clocked_in: true,
    });
    console.log(`${employee.id} is now clocked in`);
    this.callback("clockEmployeeIn");
  }

  clockEmployeeOut(employee) {
    if (!this.is_open || this.employees.get(employee.id) == null) {
      return
    }
    this.employees.get(employee.id).clocked_in = false;
    console.log(`${employee.id} is now clocked out`);
    console.log(this.employees);
    this.callback("clockEmployeeOut");
  }

  prepareFields() {
    var array = [];

    this.employees.forEach((employee) => {
      array.push({
        name: employee.username,
        value: employee.date,
        inline: true,
      });
    });

    return array;
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.handleTimer();
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timer);
  }

  handleTimer() {
    if (!this.is_open) {
      return;
    }

    this.employees.forEach((employee, employeeId) => {
      if (!employee.clocked_in) {
        return;
      }

      employee.time_elapsed = Math.floor(Math.abs(new Date() - employee.date) / 60000);

      const elapsedTime = Math.abs(new Date() - employee.last_ticket); // Calculate elapsed time in milliseconds
      const seconds = Math.floor(elapsedTime / 1000);
      const minutes = Math.floor(seconds / 60);

      if (seconds >= 150) {
        this.ticketsGenerated += 1;
        employee.tickets += 1;
        employee.last_ticket = new Date(); // Update the timestamp for the last checked-in time

        console.log(
          `Employee ${employee.username} (${employeeId}) earned 1 ticket`
        );
        console.log(
          `Total tickets for ${employee.username}: ${employee.tickets}`
        );
        this.callback("handleTimer");
      }
    });
  }
}

export default LpRunner;
