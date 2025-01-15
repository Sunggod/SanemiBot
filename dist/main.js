"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const navigationButtonHandler_1 = require("./handlers/navigationButtonHandler");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.MessageContent
    ]
});
// Inicialização da collection de comandos
client.commands = new discord_js_1.Collection();
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton())
        return;
    if (interaction.customId.startsWith('nav_')) {
        await (0, navigationButtonHandler_1.handleNavigationButton)(interaction);
    }
});
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
async function registerCommands() {
    const commands = [];
    const commandsPath = path_1.default.join(__dirname, 'commands');
    // Suporte tanto para .ts quanto para .js
    const commandFiles = fs_1.default.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path_1.default.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
        }
        else {
            console.log(`⚠️ O comando em ${filePath} está faltando 'data' ou 'execute' obrigatórios`);
        }
    }
    const rest = new discord_js_1.REST({ version: '10' }).setToken(TOKEN);
    try {
        console.log('⏳ Iniciando registro de comandos...');
        await rest.put(discord_js_1.Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('✅ Comandos registrados com sucesso!');
    }
    catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
}
client.once('ready', () => {
    console.log(`✅ Bot iniciado como ${client.user?.tag}`);
    registerCommands();
});
// Handler para interações de comando
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand() && !interaction.isModalSubmit())
        return;
    let command;
    if (interaction.isChatInputCommand()) {
        command = client.commands.get(interaction.commandName);
    }
    else if (interaction.isModalSubmit()) {
        const commandName = interaction.customId.split('_')[0];
        command = client.commands.get(commandName);
    }
    if (!command)
        return;
    try {
        if (interaction.isModalSubmit() && command.handleModal) {
            await command.handleModal(interaction);
        }
        else if (interaction.isChatInputCommand()) {
            await command.execute(interaction);
        }
    }
    catch (error) {
        console.error('❌ Erro na execução do comando:', error);
        const errorMessage = {
            content: '❌ Ocorreu um erro ao executar este comando.',
            ephemeral: true
        };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        }
        else {
            await interaction.reply(errorMessage);
        }
    }
});
client.login(TOKEN);
"";
