"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
require("dotenv/config");
const lp_runner_1 = __importDefault(require("./lp-runner"));
const establishment_1 = __importDefault(require("./entities/establishment"));
const state_1 = __importDefault(require("./entities/state"));
const commands_1 = __importDefault(require("./commands/commands"));
const client = new discord_js_1.Client({
    intents: [],
});
const establishment = new establishment_1.default("LP", "LuckyPlucker", state_1.default.closed, new Map(), 0);
const lpRunner = new lp_runner_1.default(establishment, 3, runnerCallback);
var managerMessage;
var employeeMessage;
client.on("ready", (client) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield client.application.commands.set(commands_1.default);
    console.log(`Logged in as ${(_a = client.user) === null || _a === void 0 ? void 0 : _a.tag}`);
}));
client.on(discord_js_1.Events.InteractionCreate, (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "invoke-management") {
            const embed = PrepareEmbedManagement(interaction);
            interaction
                .reply({
                embeds: [embed],
                components: [PrepareButtonsManagement()],
            })
                .then((result) => {
                result.fetch().then((result) => {
                    console.log("invoke-management success", result);
                    managerMessage = result;
                }).catch((err) => {
                    console.log("Fetch ERROR", err);
                });
            })
                .catch((err) => {
                console.log("invoke-management error", err);
                interaction.followUp({ content: "An error has occurred", ephemeral: true });
                return;
            });
        }
        if (interaction.commandName === "invoke-employee") {
            const embed = PrepareEmbedEmployees(true);
            yield interaction
                .reply({
                embeds: [embed],
                components: [PrepareButtonsEmployee()],
            })
                .then((result) => {
                result.fetch().then((result) => {
                    console.log("invoke-employee success", result);
                    employeeMessage = result;
                }).catch((err) => {
                    console.log("Fetch employeeMessage ERROR", err);
                });
            })
                .catch((err) => {
                console.log("invoke-employee error", err);
                interaction.followUp({ content: "An error has occurred", ephemeral: true });
            });
        }
    }
    if (interaction.isButton()) {
        if (interaction.customId === "clock-in") {
            lpRunner.HandleClockInButton(interaction.user);
            const embed = PrepareEmbedEmployees(false);
            yield interaction.update({
                embeds: [embed],
                components: [PrepareButtonsEmployee()],
            });
        }
        if (interaction.customId === "clock-out") {
            lpRunner.ClockEmployeeOut(interaction.user);
            const embed = PrepareEmbedEmployees(false);
            yield interaction.update({
                embeds: [embed],
                components: [PrepareButtonsEmployee()],
            });
        }
        if (interaction.customId === "open-lp") {
            lpRunner.OpenLP();
            try {
                const embed = PrepareEmbedManagement(undefined, undefined);
                interaction.update({
                    embeds: [embed],
                    components: [PrepareButtonsManagement()],
                }).then(() => {
                    console.log("open-lp success");
                }).catch((err) => {
                    console.log("open-lp error", err);
                    managerMessage.reply({ content: "An error has occurred" });
                });
            }
            catch (_b) {
                interaction.reply({ content: "Something went wrong. Please re-invoke the managament bot (/invoke-management)." });
            }
        }
        if (interaction.customId === "close-lp") {
            lpRunner.CloseLP();
            try {
                const embed = PrepareEmbedManagement(undefined, managerMessage.embeds[0]);
                const report = prepareReport(interaction);
                client.channels
                    .fetch(managerMessage.channelId)
                    .then((result) => __awaiter(void 0, void 0, void 0, function* () {
                    if (!result) {
                        console.log(`client.channels.fetch`, "Null channel");
                        return;
                    }
                    const channel = result;
                    channel.messages.fetch(managerMessage.id).then((result) => __awaiter(void 0, void 0, void 0, function* () {
                        result.edit({
                            embeds: [embed],
                            components: [],
                        }).then(() => {
                            console.log("result.edit managerMessage success");
                        }).catch((err) => {
                            console.log(`result.edit error`, err);
                        });
                        result.reply({
                            embeds: [report],
                        }).then(() => {
                            console.log("close-lp success");
                        }).catch((err) => {
                            console.log("close-lp error", err);
                            result.reply({ content: "An error has occurred" });
                        });
                        interaction.reply({ content: "Closed the restaurant.", ephemeral: true });
                    })).catch((err) => {
                        console.log(`channel.messages.fetch`, err);
                    });
                })).catch((err) => {
                    console.log(`client.channels.fetch`, err);
                });
                ;
            }
            catch (error) {
                interaction.reply({ content: "Something went wrong. Please re-invoke the managament bot (/invoke-management)." });
            }
        }
    }
}));
function PrepareButtonsEmployee() {
    const confirm = new discord_js_1.ButtonBuilder()
        .setCustomId("clock-in")
        .setLabel("Clock In")
        .setStyle(discord_js_1.ButtonStyle.Success)
        .setDisabled(lpRunner.establishment.state == state_1.default.closed);
    const cancel = new discord_js_1.ButtonBuilder()
        .setCustomId("clock-out")
        .setLabel("Clock Out")
        .setStyle(discord_js_1.ButtonStyle.Danger)
        .setDisabled(lpRunner.establishment.state == state_1.default.closed);
    const row = new discord_js_1.ActionRowBuilder().addComponents(confirm, cancel);
    return row;
}
function PrepareButtonsManagement() {
    const confirm = new discord_js_1.ButtonBuilder()
        .setCustomId("open-lp")
        .setLabel("Open LP")
        .setStyle(discord_js_1.ButtonStyle.Success)
        .setDisabled(lpRunner.establishment.state == state_1.default.open);
    const cancel = new discord_js_1.ButtonBuilder()
        .setCustomId("close-lp")
        .setLabel("Close LP")
        .setStyle(discord_js_1.ButtonStyle.Danger)
        .setDisabled(lpRunner.establishment.state == state_1.default.closed);
    const row = new discord_js_1.ActionRowBuilder().addComponents(confirm, cancel);
    return row;
}
function PrepareEmbedManagement(interaction, oldEmbed) {
    var builder = new discord_js_1.EmbedBuilder();
    const date = new Date().toDateString();
    if (oldEmbed != null) {
        builder = discord_js_1.EmbedBuilder.from(oldEmbed);
        builder.setFields([]);
    }
    else {
        builder = new discord_js_1.EmbedBuilder();
        builder.setTimestamp();
        builder.setColor("Orange");
        if (interaction) {
            builder.setFooter({
                text: `${interaction.user.username} Opened the lucky plucker`,
                iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png?size=256`,
            });
        }
    }
    builder
        .setTitle(`LP is ${(lpRunner.establishment.state == state_1.default.open) ? "Open!" : "Closed!"}`)
        .setDescription(`Employees clocked in (${lpRunner.establishment.employees_clockedIn.size}/3) - ${date}
      Tickets generated ${lpRunner.establishment.ticketsGenerated}`);
    lpRunner.establishment.employees.forEach((e) => {
        builder.addFields({
            name: `${e.username} - ${e.tickets} ticket(s)`,
            value: `${e.clockedIn
                ? `${e.lastClockIn.toLocaleString("en-US", {
                    timeZone: "America/New_York",
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                })} EST`
                : "Not clocked-in"}`,
            inline: true,
        });
    });
    return builder;
}
function PrepareEmbedEmployees(setTimestamp) {
    const builder = new discord_js_1.EmbedBuilder();
    builder
        .setColor("Orange")
        .setTitle(`LP is ${(lpRunner.establishment.state == state_1.default.open) ? "Open" : "Closed"}!`)
        .setDescription(`Employees clocked in - ${lpRunner.establishment.employees_clockedIn.size}/3`);
    lpRunner.establishment.employees_clockedIn.forEach((e) => {
        builder.addFields({
            name: `${e.username} - ${e.tickets} ticket(s)`,
            value: `${e.lastClockIn.toLocaleString("en-US", {
                timeZone: "America/New_York",
                hour: "numeric",
                minute: "numeric",
                hour12: true,
            })} EST`,
            inline: false,
        });
    });
    if (setTimestamp) {
        builder.setTimestamp();
    }
    return builder;
}
function prepareReport(interaction) {
    const builder = new discord_js_1.EmbedBuilder();
    builder
        .setColor("Orange")
        .setTitle(`LP is now closed!`)
        .setDescription(`Here's the report`);
    builder.addFields({
        name: "Total tickets generated",
        value: `${lpRunner.establishment.ticketsGenerated}`,
    });
    lpRunner.establishment.employees.forEach((e) => {
        if (e.timeElapsed != null) {
            builder.addFields({
                name: e.username,
                value: `${e.timeElapsed} minute(s) - ${e.tickets} ticket(s)`,
                inline: false,
            });
        }
    });
    builder
        .setFooter({
        text: `${interaction.user.username} Opened the lucky plucker`,
        iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png?size=256`,
    });
    return builder;
}
function runnerCallback(name) {
    return __awaiter(this, void 0, void 0, function* () {
        if (name === "open_lp" || name === "close_lp") {
            if (!employeeMessage) {
                return;
            }
            const embed = PrepareEmbedEmployees(false);
            client.channels.fetch(employeeMessage.channelId).then((result) => __awaiter(this, void 0, void 0, function* () {
                if (!result) {
                    console.log(`channel.messages.fetch ${name}`);
                    return;
                }
                const channel = result;
                channel.messages.fetch(employeeMessage.id).then((result) => __awaiter(this, void 0, void 0, function* () {
                    result.edit({
                        embeds: [embed],
                        components: [PrepareButtonsEmployee()]
                    }).then(() => {
                        console.log("result.edit employee success");
                    }).catch((err) => {
                        console.log(`result.edit error ${name}`, err);
                    });
                })).catch((err) => {
                    console.log(`channel.messages.fetch ${name}`, err);
                });
            })).catch((err) => {
                console.log(`client.channels.fetch ${name}`, err);
            });
            ;
        }
        if (name === "clockEmployeeIn" ||
            name === "clockEmployeeOut" ||
            name === "handleTimer") {
            if (!managerMessage) {
                return;
            }
            client.channels.fetch(managerMessage.channelId).then((result) => __awaiter(this, void 0, void 0, function* () {
                if (!result) {
                    console.log(`channel.messages.fetch ${name}`);
                    return;
                }
                const channel = result;
                channel.messages.fetch(managerMessage.id).then((result) => __awaiter(this, void 0, void 0, function* () {
                    const embed = PrepareEmbedManagement(undefined, result.embeds[0]);
                    result.edit({
                        embeds: [embed],
                        components: [PrepareButtonsManagement()],
                    }).then(() => {
                        console.log("result.edit management success");
                    }).catch((err) => {
                        console.log(`result.edit management ${name}`, err);
                    });
                })).catch((err) => {
                    console.log(`channel.messages.fetch management ${name}`, err);
                });
            })).catch((err) => {
                console.log(`client.channels.fetch management ${name}`, err);
            });
            ;
            if (!employeeMessage) {
                return;
            }
            const embedEmployee = PrepareEmbedEmployees(false);
            client.channels.fetch(employeeMessage.channelId).then((result) => __awaiter(this, void 0, void 0, function* () {
                if (!result) {
                    console.log(`channel.messages.fetch ${name}`);
                    return;
                }
                const channel = result;
                channel.messages.fetch(employeeMessage.id).then((result) => __awaiter(this, void 0, void 0, function* () {
                    result.edit({
                        embeds: [embedEmployee],
                        components: [PrepareButtonsEmployee()],
                    }).then(() => {
                        console.log("result.edit employee success");
                    }).catch((err) => {
                        console.log(`result.edit error employee ${name}`, err);
                    });
                })).catch((err) => {
                    console.log(`channel.messages.fetch employee ${name}`, err);
                });
            })).catch((err) => {
                console.log(`client.channels.fetch employee ${name}`, err);
            });
            ;
        }
    });
}
client.login(process.env.TOKEN);
