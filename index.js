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
var embedManagementInteraction;
var embedEmployeeInteraction;

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "invoke-management") {
      const embed = prepareEmbedManagement(interaction);

      interaction
        .reply({
          embeds: [embed],
          components: [prepareButtonsManagement()],
        })
        .then((result) => {
          managerMessage = result;
        })
        .catch((err) => {});
    }

    if (interaction.commandName === "invoke-employee") {
      const embed = prepareEmbedEmployees(interaction);

      await interaction
        .reply({
          embeds: [embed],
          components: [prepareButtonsEmployee()],
        })
        .then((result) => {
          employeeMessage = result;
        })
        .catch((err) => {});
    }
  }

  if (interaction.isButton) {
    if (interaction.customId === "clock-in") {
      lpRunner.clockEmployeeIn({
        id: interaction.user.id,
        username: interaction.user.username,
      });

      const exampleEmbed = prepareEmbedEmployees(interaction);
      await interaction.update({
        embeds: [exampleEmbed],
        components: [prepareButtonsEmployee()],
      });
    }

    if (interaction.customId === "clock-out") {
      lpRunner.clockEmployeeOut({
        id: interaction.user.id,
        username: interaction.user.username,
      });

      const exampleEmbed = prepareEmbedEmployees(interaction);
      await interaction.update({
        embeds: [exampleEmbed],
        components: [prepareButtonsEmployee()],
      });
    }

    if (interaction.customId === "open-lp") {
      console.log(`coming from \n${interaction.message}`);
      lpRunner.open_lp();

      const exampleEmbed = prepareEmbedManagement(interaction);
      await interaction.update({
        embeds: [exampleEmbed],
        components: [prepareButtonsManagement()],
      });
    }

    if (interaction.customId === "close-lp") {
      lpRunner.close_lp();

      const embed = prepareEmbedManagement(interaction);
      const report = prepareReport(interaction);

      await managerMessage.delete();

      await interaction.reply({
        embeds: [report],
      });
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

function prepareEmbedManagement(interaction) {
  const builder = new EmbedBuilder();
  const date = new Date().toDateString();

  embedManagementInteraction = interaction;

  builder
    .setColor("Orange")
    .setTitle(`LP is ${lpRunner.is_open ? "Open!" : "Closed!"}`)
    .setDescription(
      `Employees clocked in (${lpRunner.employees_clockedIn.size}/3) - ${date}
      Tickets generated ${lpRunner.ticketsGenerated}`
    );

  lpRunner.employees.forEach((e) => {
    builder.addFields({
      name: `${e.username} - ${e.tickets} ticket(s)`,
      value: `${
        e.clocked_in
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

  builder.setTimestamp().setFooter({
    text: `${interaction.user.username} Opened the lucky plucker`,
    iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png?size=256`,
  });

  return builder;
}

function prepareEmbedEmployees(interaction) {
  const builder = new EmbedBuilder();
  const date = new Date().toDateString();

  embedEmployeeInteraction = interaction;

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

  builder.setTimestamp();

  return builder;
}

function prepareReport(interaction) {
  const builder = new EmbedBuilder();
  const date = new Date().toDateString();

  embedManagementInteraction = interaction;

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

  builder.setTimestamp().setFooter({
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

    await employeeMessage.edit({
      embeds: [embed],
      components: [prepareButtonsEmployee()],
    });
  }

  if (
    name === "clockEmployeeIn" ||
    name === "clockEmployeeOut" ||
    name === "handleTimer"
  ) {
    if (!managerMessage) {
      return;
    }
    const embed = prepareEmbedManagement(embedManagementInteraction);

    await managerMessage.edit({
      embeds: [embed],
      components: [prepareButtonsManagement()],
    });

    if (!employeeMessage) {
      return;
    }

    const embedEmployee = prepareEmbedEmployees();

    await employeeMessage.edit({
      embeds: [embedEmployee],
      components: [prepareButtonsEmployee()],
    });
  }
}

client.login(process.env.TOKEN);
