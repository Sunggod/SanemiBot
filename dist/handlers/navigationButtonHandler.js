"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleNavigationButton = handleNavigationButton;
const discord_js_1 = require("discord.js");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const NAV_STORAGE_PATH = path_1.default.join(__dirname, '../data/navigationEmbeds.json');
async function getNavigationEmbed(id) {
    try {
        const data = await promises_1.default.readFile(NAV_STORAGE_PATH, 'utf-8');
        const navEmbeds = JSON.parse(data);
        return navEmbeds.find(embed => embed.id === id) || null;
    }
    catch {
        return null;
    }
}
async function handleNavigationButton(interaction) {
    try {
        // Extrai o ID do embed de navegação do customId do botão
        const navEmbedId = interaction.customId.replace('nav_', '');
        // Busca o embed de navegação
        const navEmbed = await getNavigationEmbed(navEmbedId);
        if (!navEmbed) {
            await interaction.reply({
                content: 'Embed de navegação não encontrado.',
                ephemeral: true
            });
            return;
        }
        // Obtém informações do servidor
        const guild = interaction.guild;
        const guildName = guild?.name || 'Servidor desconhecido';
        const guildIconURL = guild?.iconURL() || undefined;
        // Cria o embed de navegação
        const navigationEmbed = new discord_js_1.EmbedBuilder()
            .setAuthor({
            name: guildName,
            iconURL: guildIconURL
        })
            .setTitle(navEmbed.title)
            .setDescription(navEmbed.description)
            .setTimestamp(new Date())
            .setFooter({
            text: guildName,
            iconURL: guildIconURL
        });
        // Define a cor do embed, se disponível
        if (navEmbed.color) {
            navigationEmbed.setColor(navEmbed.color);
        }
        // Define a imagem do embed, se disponível
        if (navEmbed.image) {
            navigationEmbed.setImage(navEmbed.image);
        }
        await interaction.reply({
            embeds: [navigationEmbed],
            ephemeral: true
        });
    }
    catch (error) {
        console.error('Erro ao manipular botão de navegação:', error);
        await interaction.reply({
            content: 'Ocorreu um erro ao processar a navegação.',
            ephemeral: true
        }).catch(console.error);
    }
}
