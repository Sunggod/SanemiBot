"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// commands/createNavigationEmbed.ts
const discord_js_1 = require("discord.js");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const STORAGE_PATH = path_1.default.join(__dirname, '../data/navigationEmbeds.json');
// Funções de utilidade
const ensureStorageFile = async () => {
    try {
        await promises_1.default.access(STORAGE_PATH);
    }
    catch {
        await promises_1.default.mkdir(path_1.default.dirname(STORAGE_PATH), { recursive: true });
        await promises_1.default.writeFile(STORAGE_PATH, JSON.stringify([], null, 2));
    }
};
const readNavigationEmbeds = async () => {
    await ensureStorageFile();
    const data = await promises_1.default.readFile(STORAGE_PATH, 'utf-8');
    return data.trim() ? JSON.parse(data) : [];
};
const saveNavigationEmbeds = async (embeds) => {
    await promises_1.default.writeFile(STORAGE_PATH, JSON.stringify(embeds, null, 2));
};
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('create_navigation_embed')
        .setDescription('Cria um novo embed de navegação')
        .addStringOption(option => option
        .setName('title')
        .setDescription('Título do embed de navegação')
        .setRequired(true))
        .addStringOption(option => option
        .setName('description')
        .setDescription('Descrição do embed de navegação')
        .setRequired(true))
        .addStringOption(option => option
        .setName('image')
        .setDescription('URL da imagem do embed')
        .setRequired(false)),
    async execute(interaction) {
        const channel = interaction.channel;
        if (!channel || channel.type !== discord_js_1.ChannelType.GuildText) {
            await interaction.reply({
                content: '❌ Este comando só pode ser usado em canais de texto de um servidor.',
                ephemeral: true
            });
            return;
        }
        try {
            // Captura os valores das opções
            const title = interaction.options.get('title')?.value;
            const description = interaction.options.get('description')?.value;
            const image = interaction.options.get('image')?.value;
            // Validações de entrada
            if (!title || !description) {
                throw new Error('Título e descrição são obrigatórios.');
            }
            // Lê os embeds existentes
            const embeds = await readNavigationEmbeds();
            // Cria o novo embed
            const newEmbed = {
                id: (0, uuid_1.v4)(),
                title,
                description,
                image,
                channelId: channel.id,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            // Salva o embed no arquivo
            await saveNavigationEmbeds([...embeds, newEmbed]);
            // Cria o preview do embed
            const previewEmbed = new discord_js_1.EmbedBuilder()
                .setTitle(newEmbed.title)
                .setDescription(newEmbed.description)
                .setTimestamp(newEmbed.createdAt)
                .setFooter({ text: `ID: ${newEmbed.id}` });
            if (newEmbed.image) {
                previewEmbed.setImage(newEmbed.image);
            }
            // Responde com o embed de preview
            await interaction.reply({
                content: '✅ Embed de navegação criado com sucesso! Preview:',
                embeds: [previewEmbed],
                ephemeral: true
            });
        }
        catch (error) {
            console.error('Erro ao criar navigation embed:', error);
            await interaction.reply({
                content: `❌ Ocorreu um erro ao criar o embed de navegação: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
