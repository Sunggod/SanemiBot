// commands/createNavigationEmbed.ts
import { 
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
  TextChannel,
  ChannelType,
  ChatInputCommandInteraction
} from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { NavigationEmbed } from '../types/NavigationEmbed';

const STORAGE_PATH = path.join(__dirname, '../data/navigationEmbeds.json');

// Funções de utilidade
const ensureStorageFile = async () => {
  try {
    await fs.access(STORAGE_PATH);
  } catch {
    await fs.mkdir(path.dirname(STORAGE_PATH), { recursive: true });
    await fs.writeFile(STORAGE_PATH, JSON.stringify([], null, 2));
  }
};

const readNavigationEmbeds = async (): Promise<NavigationEmbed[]> => {
  await ensureStorageFile();
  const data = await fs.readFile(STORAGE_PATH, 'utf-8');
  return data.trim() ? JSON.parse(data) : [];
};

const saveNavigationEmbeds = async (embeds: NavigationEmbed[]): Promise<void> => {
  await fs.writeFile(STORAGE_PATH, JSON.stringify(embeds, null, 2));
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create_navigation_embed')
    .setDescription('Cria um novo embed de navegação')
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('Título do embed de navegação')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('Descrição do embed de navegação')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('image')
        .setDescription('URL da imagem do embed')
        .setRequired(false)
    ),

  async execute(interaction: CommandInteraction) {
    const channel = interaction.channel;
    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: '❌ Este comando só pode ser usado em canais de texto de um servidor.',
        ephemeral: true
      });
      return;
    }
  
    try {
      // Captura os valores das opções
      const title = interaction.options.get('title')?.value as string;
      const description = interaction.options.get('description')?.value as string;
      const image = interaction.options.get('image')?.value as string | undefined;

      // Validações de entrada
      if (!title || !description) {
        throw new Error('Título e descrição são obrigatórios.');
      }


      // Lê os embeds existentes
      const embeds = await readNavigationEmbeds();

      // Cria o novo embed
      const newEmbed: NavigationEmbed = {
        id: uuidv4(),
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
      const previewEmbed = new EmbedBuilder()
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

    } catch (error:any) {
      console.error('Erro ao criar navigation embed:', error);
      await interaction.reply({ 
        content: `❌ Ocorreu um erro ao criar o embed de navegação: ${error.message}`,
        ephemeral: true 
      });
    }
  }
};
