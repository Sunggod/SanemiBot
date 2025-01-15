"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// commands/mainEmbed.ts
const discord_js_1 = require("discord.js");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const STORAGE_PATH = path_1.default.join(__dirname, '../data/mainEmbeds.json');
const NAV_STORAGE_PATH = path_1.default.join(__dirname, '../data/navigationEmbeds.json');
// Funções de utilidade
const ensureStorageFile = async (filePath) => {
    try {
        await promises_1.default.access(filePath);
    }
    catch {
        await promises_1.default.mkdir(path_1.default.dirname(filePath), { recursive: true });
        await promises_1.default.writeFile(filePath, JSON.stringify([], null, 2));
    }
};
const readMainEmbeds = async () => {
    await ensureStorageFile(STORAGE_PATH);
    try {
        const data = await promises_1.default.readFile(STORAGE_PATH, 'utf-8');
        return JSON.parse(data.trim() || '[]');
    }
    catch (error) {
        console.error('Erro ao ler main embeds:', error);
        return [];
    }
};
const readNavigationEmbeds = async () => {
    await ensureStorageFile(NAV_STORAGE_PATH);
    try {
        const data = await promises_1.default.readFile(NAV_STORAGE_PATH, 'utf-8');
        return JSON.parse(data.trim() || '[]');
    }
    catch (error) {
        console.error('Erro ao ler navigation embeds:', error);
        return [];
    }
};
const saveMainEmbeds = async (embeds) => {
    await promises_1.default.writeFile(STORAGE_PATH, JSON.stringify(embeds, null, 2));
};
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('create_main_embed')
        .setDescription('Cria um novo embed principal')
        .addStringOption(option => option
        .setName('title')
        .setDescription('Título do embed')
        .setRequired(true))
        .addStringOption(option => option
        .setName('description')
        .setDescription('Descrição do embed')
        .setRequired(true))
        .addStringOption(option => option
        .setName('image')
        .setDescription('URL da imagem do embed')
        .setRequired(false))
        .addStringOption(option => option
        .setName('color')
        .setDescription('Cor do embed em hexadecimal')
        .setRequired(false)),
    async execute(interaction) {
        const channel = interaction.channel;
        try {
            const navigationEmbeds = await readNavigationEmbeds();
            if (navigationEmbeds.length === 0) {
                await interaction.reply({
                    content: '❌ Não existem embeds de navegação. Crie pelo menos um usando /create_navigation_embed',
                    ephemeral: true
                });
                return;
            }
            const selectMenu = new discord_js_1.StringSelectMenuBuilder()
                .setCustomId('nav_embed_select')
                .setPlaceholder('Selecione até 3 embeds de navegação')
                .setMinValues(1)
                .setMaxValues(Math.min(3, navigationEmbeds.length))
                .addOptions(navigationEmbeds.map(nav => ({
                label: nav.title,
                value: `nav_${nav.id.padEnd(3, '_')}`,
                description: nav.description.substring(0, 50) + '...'
            })));
            const row = new discord_js_1.ActionRowBuilder()
                .addComponents(selectMenu);
            const response = await interaction.reply({
                content: '📝 Selecione os embeds de navegação que deseja adicionar (máximo 3):',
                components: [row],
                ephemeral: true
            });
            try {
                const collection = await response.awaitMessageComponent({
                    filter: i => i.user.id === interaction.user.id,
                    time: 60000,
                    componentType: discord_js_1.ComponentType.StringSelect
                });
                const selectedIds = collection.values.map(value => value.replace('nav_', '').replace(/_+$/, ''));
                const title = interaction.options.getString('title', true);
                const description = interaction.options.getString('description', true);
                const image = interaction.options.getString('image') || undefined;
                const color = interaction.options.getString('color') || undefined;
                const mainEmbedsData = await readMainEmbeds();
                const filteredEmbeds = mainEmbedsData.filter(embed => embed.channelId !== channel.id);
                const newEmbed = {
                    id: Math.random().toString(36).substring(2, 15),
                    title,
                    description,
                    image,
                    channelId: channel.id,
                    color,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    navigationEmbeds: selectedIds.map(id => navigationEmbeds.find(nav => nav.id === id)),
                    buttons: selectedIds.map((id, index) => ({
                        id: Math.random().toString(36).substring(2, 15),
                        label: navigationEmbeds.find(nav => nav.id === id)?.title || `Navegação ${index + 1}`,
                        style: 'PRIMARY',
                        mainEmbedId: channel.id,
                        navigationEmbedId: id,
                        position: index
                    }))
                };
                const guild = interaction.guild;
                const guildName = guild?.name || 'Servidor desconhecido';
                const guildIconURL = guild?.iconURL() || undefined;
                await saveMainEmbeds([...filteredEmbeds, newEmbed]);
                const discordEmbed = new discord_js_1.EmbedBuilder()
                    .setAuthor({
                    name: guildName,
                    iconURL: guildIconURL
                })
                    .setTitle(newEmbed.title)
                    .setDescription(newEmbed.description)
                    .setFooter({
                    text: guildName,
                    iconURL: guildIconURL
                });
                if (newEmbed.image) {
                    discordEmbed.setImage(newEmbed.image);
                }
                if (newEmbed.color) {
                    discordEmbed.setColor(newEmbed.color);
                }
                const buttonRow = new discord_js_1.ActionRowBuilder();
                for (const button of newEmbed.buttons) {
                    buttonRow.addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId(`nav_${button.navigationEmbedId}`)
                        .setLabel(button.label)
                        .setStyle(discord_js_1.ButtonStyle.Primary));
                }
                await channel.send({
                    embeds: [discordEmbed],
                    components: [buttonRow]
                });
                await collection.update({
                    content: '✅ Embed principal criado com sucesso!',
                    components: []
                });
            }
            catch (error) {
                console.error('Erro ao processar seleção:', error);
                await interaction.editReply({
                    content: '⚠️ Tempo de seleção expirado ou ocorreu um erro.',
                    components: []
                });
            }
        }
        catch (error) {
            console.error('Erro ao criar main embed:', error);
            await interaction.reply({
                content: '❌ Ocorreu um erro ao criar o embed principal.',
                ephemeral: true
            });
        }
    }
};
