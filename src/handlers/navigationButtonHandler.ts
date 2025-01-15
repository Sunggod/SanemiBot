import { 
  ButtonInteraction, 
  EmbedBuilder 
} from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
import { NavigationEmbed } from '../types/NavigationEmbed';

const NAV_STORAGE_PATH = path.join(__dirname, '../data/navigationEmbeds.json');

async function getNavigationEmbed(id: string): Promise<NavigationEmbed | null> {
  try {
    const data = await fs.readFile(NAV_STORAGE_PATH, 'utf-8');
    const navEmbeds: NavigationEmbed[] = JSON.parse(data);
    return navEmbeds.find(embed => embed.id === id) || null;
  } catch {
    return null;
  }
}

export async function handleNavigationButton(interaction: ButtonInteraction) {
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
    const navigationEmbed = new EmbedBuilder()
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
  } catch (error) {
    console.error('Erro ao manipular botão de navegação:', error);
    await interaction.reply({
      content: 'Ocorreu um erro ao processar a navegação.',
      ephemeral: true
    }).catch(console.error);
  }
}
