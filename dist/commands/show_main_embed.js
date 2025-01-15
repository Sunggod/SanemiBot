"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const STORAGE_PATH = path_1.default.join(__dirname, '../data/mainEmbeds.json');
// Função para ler os MainEmbeds do arquivo
const readMainEmbeds = async () => {
    try {
        const data = await promises_1.default.readFile(STORAGE_PATH, 'utf-8');
        return JSON.parse(data.trim() || '[]');
    }
    catch (error) {
        console.error('Erro ao ler main embeds:', error);
        return [];
    }
};
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('show_main_embed')
        .setDescription('Exibe o embed principal do canal atual'),
    async execute(interaction) {
        const channel = interaction.channel;
        try {
            // Lê os MainEmbeds do arquivo
            const mainEmbeds = await readMainEmbeds();
            // Busca o MainEmbed correspondente ao canal atual
            const mainEmbed = mainEmbeds.find(embed => embed.channelId === channel.id);
            if (!mainEmbed) {
                await interaction.reply({
                    content: '❌ Nenhum embed principal encontrado para este canal.',
                    ephemeral: true
                });
                return;
            }
            // Obtém informações do servidor
            const guild = interaction.guild;
            const guildName = guild?.name || 'Servidor desconhecido';
            const guildIconURL = guild?.iconURL() || undefined;
            // Cria o embed a partir dos dados do MainEmbed
            const discordEmbed = new discord_js_1.EmbedBuilder()
                .setAuthor({
                name: guildName,
                iconURL: guildIconURL
            })
                .setTitle(mainEmbed.title)
                .setDescription(mainEmbed.description)
                .setFooter({
                text: guildName,
                iconURL: guildIconURL
            });
            if (mainEmbed.image) {
                discordEmbed.setImage(mainEmbed.image);
            }
            if (mainEmbed.color) {
                discordEmbed.setColor(mainEmbed.color);
            }
            // Cria os botões de navegação
            const buttonRow = new discord_js_1.ActionRowBuilder();
            for (const button of mainEmbed.buttons) {
                buttonRow.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId(`nav_${button.navigationEmbedId}`)
                    .setLabel(button.label)
                    .setStyle(discord_js_1.ButtonStyle.Primary));
            }
            // Envia o embed com os botões no canal atual
            await channel.send({
                embeds: [discordEmbed],
                components: [buttonRow]
            });
            await interaction.reply({
                content: '✅ Embed principal exibido com sucesso!',
                ephemeral: true
            });
        }
        catch (error) {
            console.error('Erro ao exibir main embed:', error);
            await interaction.reply({
                content: '❌ Ocorreu um erro ao exibir o embed principal.',
                ephemeral: true
            });
        }
    }
};
