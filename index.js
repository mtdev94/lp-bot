import {
  Client,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
} from "discord.js";
import { LpRunner } from "./lp-runner.js";
import 'dotenv/config';

const client = new Client({
  intents: [],
});

const lpRunner = new LpRunner(runnerCallback);

var managerMessage;
var employeeMessage;

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "invoke-management") {
      const embed = prepareEmbedManagement({ interaction: interaction, oldEmbed: null });

      interaction
        .reply({
          embeds: [embed],
          components: [prepareButtonsManagement()],
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
      const embed = prepareEmbedEmployees(interaction);

      await interaction
        .reply({
          embeds: [embed],
          components: [prepareButtonsEmployee()],
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

  if (interaction.isButton) {
    if (interaction.customId === "clock-in") {
      lpRunner.clockEmployeeIn({
        id: interaction.user.id,
        username: interaction.user.username,
      });

      const embed = prepareEmbedEmployees(interaction);

      await interaction.update({
        embeds: [embed],
        components: [prepareButtonsEmployee()],
      });

    }

    if (interaction.customId === "clock-out") {
      lpRunner.clockEmployeeOut({
        id: interaction.user.id,
        username: interaction.user.username,
      });

      const embed = prepareEmbedEmployees(interaction);
      await interaction.update({
        embeds: [embed],
        components: [prepareButtonsEmployee()],
      });
    }

    if (interaction.customId === "open-lp") {
      lpRunner.open_lp();

      try {
        const embed = prepareEmbedManagement({ oldEmbed: managerMessage.embeds[0] });
        interaction.update({
          embeds: [embed],
          components: [prepareButtonsManagement()],
        }).then(() => {
          console.log("open-lp success");
        }).catch((err) => {
          console.log("open-lp error", err);
          managerMessage.reoly({ content: "An error has occurred", ephemeral: true });
        });
      } catch {
        interaction.reply({ content: "Something went wrong. Please re-invoke the managament bot (/invoke-management)." })
      }
    }

    if (interaction.customId === "close-lp") {
      lpRunner.close_lp();

      try {
        const embed = prepareEmbedManagement({ oldEmbed: managerMessage.embeds[0] });
        const report = prepareReport(interaction);
  
        client.channels.fetch(managerMessage.channelId).then(async (channel) => {
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
              result.reply({ content: "An error has occurred", ephemeral: true });
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

function prepareButtonsEmployee() {
  const confirm = new ButtonBuilder()
    .setCustomId("clock-in")
    .setLabel("Clock In")
    .setStyle(ButtonStyle.Success)
    .setDisabled(!lpRunner.is_open);

  const cancel = new ButtonBuilder()
    .setCustomId("clock-out")
    .setLabel("Clock Out")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(!lpRunner.is_open);

  const row = new ActionRowBuilder().addComponents(confirm, cancel);

  return row;
}

function prepareButtonsManagement() {
  const confirm = new ButtonBuilder()
    .setCustomId("open-lp")
    .setLabel("Open LP")
    .setStyle(ButtonStyle.Success)
    .setDisabled(lpRunner.is_open);

  const cancel = new ButtonBuilder()
    .setCustomId("close-lp")
    .setLabel("Close LP")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(!lpRunner.is_open);

  const row = new ActionRowBuilder().addComponents(confirm, cancel);

  return row;
}

function prepareEmbedManagement({ interaction, oldEmbed }) {
  var builder = {};
  const date = new Date().toDateString();

  if (oldEmbed) {
    builder = EmbedBuilder.from(oldEmbed);
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
    .setTitle(`LP is ${lpRunner.is_open ? "Open!" : "Closed!"}`)
    .setDescription(
      `Employees clocked in (${lpRunner.employees_clockedIn.size}/3) - ${date}
      Tickets generated ${lpRunner.ticketsGenerated}`
    );

  lpRunner.employees.forEach((e) => {
    builder.addFields({
      name: `${e.username} - ${e.tickets} ticket(s)`,
      value: `${e.clocked_in
        ? `${e.date.toLocaleString("en-US", {
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

function prepareEmbedEmployees(setTimestamp) {
  const builder = new EmbedBuilder();

  builder
    .setColor("Orange")
    .setTitle(`LP is ${lpRunner.is_open ? "Open" : "Closed"}!`)
    .setDescription(
      `Employees clocked in - ${lpRunner.employees_clockedIn.size}/3`
    );

  lpRunner.employees_clockedIn.forEach((e) => {
    builder.addFields({
      name: `${e.username} - ${e.tickets} ticket(s)`,
      value: `${e.date.toLocaleString("en-US", {
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
  const builder = new EmbedBuilder();

  builder
    .setColor("Orange")
    .setTitle(`LP is now closed!`)
    .setDescription(`Here's the report`);

  builder.addFields({
    name: "Total tickets generated",
    value: `${lpRunner.ticketsGenerated}`,
  });

  lpRunner.employees.forEach((e) => {
    builder.addFields({
      name: e.username,
      value: `${e.time_elapsed} minute(s) - ${e.tickets} ticket(s)`,
      inline: false,
    });
  });

  builder
    .setFooter({
      text: `${interaction.user.username} Opened the lucky plucker`,
      iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png?size=256`,
    });

  return builder;
}

async function runnerCallback(name) {
  if (name === "open_lp" || name === "close_lp") {
    if (!employeeMessage) {
      return;
    }
    const embed = prepareEmbedEmployees();

    client.channels.fetch(employeeMessage.channelId).then(async (channel) => {
      channel.messages.fetch(employeeMessage.id).then(async (result) => {
        result.edit({
          embeds: [embed],
          components: [prepareButtonsEmployee()]
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

    client.channels.fetch(managerMessage.channelId).then(async (channel) => {
      channel.messages.fetch(managerMessage.id).then(async (result) => {
        const embed = prepareEmbedManagement({ oldEmbed: result.embeds[0] });

        result.edit({
          embeds: [embed],
          components: [prepareButtonsManagement()],
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

    const embedEmployee = prepareEmbedEmployees();

    client.channels.fetch(employeeMessage.channelId).then(async (channel) => {

      channel.messages.fetch(employeeMessage.id).then(async (result) => {
        result.edit({
          embeds: [embedEmployee],
          components: [prepareButtonsEmployee()],
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

client.login(process.env.TOKEN);