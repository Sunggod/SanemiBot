import { 
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ColorResolvable
} from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
import { MainEmbed } from '../types/MainEmbed';

const STORAGE_PATH = path.join(__dirname, '../data/mainEmbeds.json');

// Função para ler os MainEmbeds do arquivo
const readMainEmbeds = async (): Promise<MainEmbed[]> => {
  try {
    const data = await fs.readFile(STORAGE_PATH, 'utf-8');
    return JSON.parse(data.trim() || '[]');
  } catch (error) {
    console.error('Erro ao ler main embeds:', error);
    return [];
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('show_main_embed')
    .setDescription('Exibe o embed principal do canal atual'),

  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.channel as TextChannel;

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
      const discordEmbed = new EmbedBuilder()
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
        discordEmbed.setColor(mainEmbed.color as ColorResolvable);
      }

      // Cria os botões de navegação
      const buttonRow = new ActionRowBuilder<ButtonBuilder>();

      for (const button of mainEmbed.buttons) {
        buttonRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`nav_${button.navigationEmbedId}`)
            .setLabel(button.label)
            .setStyle(ButtonStyle.Primary)
        );
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

    } catch (error) {
      console.error('Erro ao exibir main embed:', error);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao exibir o embed principal.',
        ephemeral: true
      });
    }
  }
};
