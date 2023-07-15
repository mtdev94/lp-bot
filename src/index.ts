import {
  Client,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
  Message,
  Interaction,
  Embed,
  TextChannel,
} from "discord.js";

import 'dotenv/config';
import LpRunner from "./lp-runner";
import Establishment from "./entities/establishment";
import State from "./entities/state";
import commands from "./commands/commands";


const client = new Client({
  intents: [],
});

const establishment = new Establishment("LP", "LuckyPlucker", State.closed, new Map(), 0);

const lpRunner = new LpRunner(establishment, 3, runnerCallback);

var managerMessage: Message<boolean>;
var employeeMessage: Message<boolean>;

client.on("ready", async (client) => {
  await client.application.commands.set(commands);
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
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

      await interaction
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

      await interaction.update({
        embeds: [embed],
        components: [PrepareButtonsEmployee()],
      });

    }

    if (interaction.customId === "clock-out") {
      lpRunner.ClockEmployeeOut(interaction.user);

      const embed = PrepareEmbedEmployees(false);
      await interaction.update({
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
      } catch {
        interaction.reply({ content: "Something went wrong. Please re-invoke the managament bot (/invoke-management)." })
      }
    }

    if (interaction.customId === "close-lp") {
      lpRunner.CloseLP();

      try {
        const embed = PrepareEmbedManagement(undefined, managerMessage.embeds[0]);
        const report = prepareReport(interaction);

        client.channels
          .fetch(managerMessage.channelId)
          .then(async (result) => {
            if (!result) {
              console.log(`client.channels.fetch`, "Null channel");
              return
            }

            const channel = result as TextChannel;

            channel.messages.fetch(managerMessage.id).then(async (result) => {
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

              interaction.reply({ content: "Closed the restaurant.", ephemeral: true })

            }).catch((err) => {
              console.log(`channel.messages.fetch`, err);
            });
          }).catch((err) => {
            console.log(`client.channels.fetch`, err);
          });;
      } catch (error) {
        interaction.reply({ content: "Something went wrong. Please re-invoke the managament bot (/invoke-management)." })
      }
    }
  }
});

function PrepareButtonsEmployee() {
  const confirm = new ButtonBuilder()
    .setCustomId("clock-in")
    .setLabel("Clock In")
    .setStyle(ButtonStyle.Success)
    .setDisabled(lpRunner.establishment.state == State.closed);

  const cancel = new ButtonBuilder()
    .setCustomId("clock-out")
    .setLabel("Clock Out")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(lpRunner.establishment.state == State.closed);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirm, cancel);

  return row;
}

function PrepareButtonsManagement(): ActionRowBuilder<ButtonBuilder> {
  const confirm = new ButtonBuilder()
    .setCustomId("open-lp")
    .setLabel("Open LP")
    .setStyle(ButtonStyle.Success)
    .setDisabled(lpRunner.establishment.state == State.open);

  const cancel = new ButtonBuilder()
    .setCustomId("close-lp")
    .setLabel("Close LP")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(lpRunner.establishment.state == State.closed);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirm, cancel);

  return row;
}

function PrepareEmbedManagement(interaction?: Interaction, oldEmbed?: Embed) {
  var builder = new EmbedBuilder();
  const date = new Date().toDateString();

  if (oldEmbed != null) {
    builder = EmbedBuilder.from(oldEmbed);
    builder.setFields([]);
  } else {
    builder = new EmbedBuilder();
    builder.setTimestamp();
    builder.setColor("Orange")

    if (interaction) {
      builder.setFooter({
        text: `${interaction.user.username} Opened the lucky plucker`,
        iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png?size=256`,
      });
    }
  }

  builder
    .setTitle(`LP is ${(lpRunner.establishment.state == State.open) ? "Open!" : "Closed!"}`)
    .setDescription(
      `Employees clocked in (${lpRunner.establishment.employees_clockedIn.size}/3) - ${date}
      Tickets generated ${lpRunner.establishment.ticketsGenerated}`
    );

    var employees = Array.from(lpRunner.establishment.employees);

    employees = employees.sort((a, b) => a[1].lastClockIn.getTime() - b[1].lastClockIn.getTime());
    employees = employees.slice(0, 20);

    employees.forEach((e) => {
    builder.addFields({
      name: `${e[1].username} - ${e[1].tickets} ticket(s)`,
      value: `${e[1].clockedIn
        ? `${e[1].lastClockIn.toLocaleString("en-US", {
          timeZone: "America/New_York",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        })} EST`
        : "Not clocked-in"
        }`,
      inline: true,
    });
  });

  return builder;
}

function PrepareEmbedEmployees(setTimestamp: boolean) {
  const builder = new EmbedBuilder();

  builder
    .setColor("Orange")
    .setTitle(`LP is ${(lpRunner.establishment.state == State.open) ? "Open" : "Closed"}!`)
    .setDescription(
      `Employees clocked in - ${lpRunner.establishment.employees_clockedIn.size}/3`
    );

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

function prepareReport(interaction: Interaction): EmbedBuilder {
  const builder = new EmbedBuilder();

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
      text: `${interaction.user.username} Closed the lucky plucker`,
      iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png?size=256`,
    });

  return builder;
}

async function runnerCallback(name: string) {
  if (name === "open_lp" || name === "close_lp") {
    if (!employeeMessage) {
      return;
    }
    const embed = PrepareEmbedEmployees(false);

    client.channels.fetch(employeeMessage.channelId).then(async (result) => {
      if (!result) {
        console.log(`channel.messages.fetch ${name}`);
        return
      }

      const channel = result as TextChannel;

      channel.messages.fetch(employeeMessage.id).then(async (result) => {
        result.edit({
          embeds: [embed],
          components: [PrepareButtonsEmployee()]
        }).then(() => {
          console.log("result.edit employee success");
        }).catch((err) => {
          console.log(`result.edit error ${name}`, err);
        });
      }).catch((err) => {
        console.log(`channel.messages.fetch ${name}`, err);
      });
    }).catch((err) => {
      console.log(`client.channels.fetch ${name}`, err);
    });;
  }

  if (
    name === "clockEmployeeIn" ||
    name === "clockEmployeeOut" ||
    name === "handleTimer"
  ) {
    if (!managerMessage) {
      return;
    }

    client.channels.fetch(managerMessage.channelId).then(async (result) => {
      if (!result) {
        console.log(`channel.messages.fetch ${name}`);
        return
      }

      const channel = result as TextChannel;
      channel.messages.fetch(managerMessage.id).then(async (result) => {
        const embed = PrepareEmbedManagement(undefined, result.embeds[0]);

        result.edit({
          embeds: [embed],
          components: [PrepareButtonsManagement()],
        }).then(() => {
          console.log("result.edit management success");
        }).catch((err) => {
          console.log(`result.edit management ${name}`, err);
        });
      }).catch((err) => {
        console.log(`channel.messages.fetch management ${name}`, err);
      });
    }).catch((err) => {
      console.log(`client.channels.fetch management ${name}`, err);
    });;

    if (!employeeMessage) {
      return;
    }

    const embedEmployee = PrepareEmbedEmployees(false);

    client.channels.fetch(employeeMessage.channelId).then(async (result) => {
      if (!result) {
        console.log(`channel.messages.fetch ${name}`);
        return
      }

      const channel = result as TextChannel;
      channel.messages.fetch(employeeMessage.id).then(async (result) => {
        result.edit({
          embeds: [embedEmployee],
          components: [PrepareButtonsEmployee()],
        }).then(() => {
          console.log("result.edit employee success");
        }).catch((err) => {
          console.log(`result.edit error employee ${name}`, err);
        });
      }).catch((err) => {
        console.log(`channel.messages.fetch employee ${name}`, err);
      });
    }).catch((err) => {
      console.log(`client.channels.fetch employee ${name}`, err);
    });;
  }
}
console.log(process.env.TOKEN);
client.login(process.env.TOKEN);