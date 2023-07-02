import "dotenv/config";
import { ChatInputApplicationCommandData } from "discord.js";

export interface Command extends ChatInputApplicationCommandData {}

export const LP_EMPLOYEE: Command = {
    name: "invoke-employee",
    description: "Invoke the LP-Bot in an employee channel",
    type: 1,
}

export const LP_MANAGEMENT: Command = {
    name: "invoke-management",
    description: "Invoke the LP-Bot in a management channel",
    type: 1,
}

export let interactionCommands: ChatInputApplicationCommandData[] = [LP_EMPLOYEE, LP_MANAGEMENT];

export default interactionCommands;