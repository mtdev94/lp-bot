
export class Employee {
    id: string;
    lastClockIn: Date;
    username: string;
    clockedIn: boolean;
    tickets: number;
    lastTicket: Date;
    timeElapsed?: number;

    constructor(id: string, lastClockIn: Date, username: string, clockedIn: boolean, tickets: number, lastTicket: Date) {
        this.id = id;
        this.lastClockIn = lastClockIn;
        this.username = username;
        this.clockedIn = clockedIn;
        this.tickets = tickets;
        this.lastTicket = lastTicket;
    }
}

export default Employee;