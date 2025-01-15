import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { SlashCommandBuilder } from '@discordjs/builders';
import { handleNavigationButton } from './handlers/navigationButtonHandler';
import dotenv from 'dotenv';
dotenv.config();
// Extensão da interface Client
declare module 'discord.js' {
    interface Client {
        commands: Collection<string, {
            data: SlashCommandBuilder;
            execute: Function;
            handleModal?: Function;
        }>;
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

// Inicialização da collection de comandos
client.commands = new Collection();
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    
    if (interaction.customId.startsWith('nav_')) {
      await handleNavigationButton(interaction);
    }
  });
  
  const TOKEN = process.env.DISCORD_TOKEN;
  const CLIENT_ID = process.env.CLIENT_ID;

async function registerCommands() {
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    
    // Suporte tanto para .ts quanto para .js
    const commandFiles = fs.readdirSync(commandsPath).filter(file => 
        file.endsWith('.ts') || file.endsWith('.js')
    );

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
        } else {
            console.log(`⚠️ O comando em ${filePath} está faltando 'data' ou 'execute' obrigatórios`);
        }
    }

    const rest = new REST({ version: '10' }).setToken(TOKEN as any);

    try {
        console.log('⏳ Iniciando registro de comandos...');
        await rest.put(
            Routes.applicationCommands(CLIENT_ID as any),
            { body: commands }
        );
        console.log('✅ Comandos registrados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
}

client.once('ready', () => {
    console.log(`✅ Bot iniciado como ${client.user?.tag}`);
    registerCommands();
});

// Handler para interações de comando
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand() && !interaction.isModalSubmit()) return;

    let command;
    if (interaction.isChatInputCommand()) {
        command = client.commands.get(interaction.commandName);
    } else if (interaction.isModalSubmit()) {
        const commandName = interaction.customId.split('_')[0];
        command = client.commands.get(commandName);
    }

    if (!command) return;

    try {
        if (interaction.isModalSubmit() && command.handleModal) {
            await command.handleModal(interaction);
        } else if (interaction.isChatInputCommand()) {
            await command.execute(interaction);
        }
    } catch (error) {
        console.error('❌ Erro na execução do comando:', error);
        const errorMessage = {
            content: '❌ Ocorreu um erro ao executar este comando.',
            ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

client.login(TOKEN);""