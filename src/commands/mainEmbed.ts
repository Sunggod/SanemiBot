// commands/mainEmbed.ts
import { 
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
  ChannelType,
  TextChannel,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ChatInputCommandInteraction,
  ColorResolvable
} from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
import { MainEmbed } from '../types/MainEmbed';
import { NavigationEmbed } from '../types/NavigationEmbed';

const STORAGE_PATH = path.join(__dirname, '../data/mainEmbeds.json');
const NAV_STORAGE_PATH = path.join(__dirname, '../data/navigationEmbeds.json');

// Funções de utilidade
const ensureStorageFile = async (filePath: string) => {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify([], null, 2));
  }
};

const readMainEmbeds = async (): Promise<MainEmbed[]> => {
  await ensureStorageFile(STORAGE_PATH);
  try {
    const data = await fs.readFile(STORAGE_PATH, 'utf-8');
    return JSON.parse(data.trim() || '[]');
  } catch (error) {
    console.error('Erro ao ler main embeds:', error);
    return [];
  }
};

const readNavigationEmbeds = async (): Promise<NavigationEmbed[]> => {
  await ensureStorageFile(NAV_STORAGE_PATH);
  try {
    const data = await fs.readFile(NAV_STORAGE_PATH, 'utf-8');
    return JSON.parse(data.trim() || '[]');
  } catch (error) {
    console.error('Erro ao ler navigation embeds:', error);
    return [];
  }
};

const saveMainEmbeds = async (embeds: MainEmbed[]): Promise<void> => {
  await fs.writeFile(STORAGE_PATH, JSON.stringify(embeds, null, 2));
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create_main_embed')
    .setDescription('Cria um novo embed principal')
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('Título do embed')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('Descrição do embed')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('image')
        .setDescription('URL da imagem do embed')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('color')
        .setDescription('Cor do embed em hexadecimal')
        .setRequired(false)
    ),
    

  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.channel as TextChannel;

    try {
      const navigationEmbeds = await readNavigationEmbeds();

      if (navigationEmbeds.length === 0) {
        await interaction.reply({
          content: '❌ Não existem embeds de navegação. Crie pelo menos um usando /create_navigation_embed',
          ephemeral: true
        });
        return;
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('nav_embed_select')
        .setPlaceholder('Selecione até 3 embeds de navegação')
        .setMinValues(1)
        .setMaxValues(Math.min(3, navigationEmbeds.length))
        .addOptions(
          navigationEmbeds.map(nav => ({
            label: nav.title,
            value: `nav_${nav.id.padEnd(3, '_')}`,
            description: nav.description.substring(0, 50) + '...'
          }))
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>()
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
          componentType: ComponentType.StringSelect
        });
        
        const selectedIds = collection.values.map(value => value.replace('nav_', '').replace(/_+$/, ''));
        const title = interaction.options.getString('title', true);
        const description = interaction.options.getString('description', true);
        const image = interaction.options.getString('image') || undefined;
        const color = interaction.options.getString('color') || undefined
        const mainEmbedsData = await readMainEmbeds();
        const filteredEmbeds = mainEmbedsData.filter(embed => embed.channelId !== channel.id);

        const newEmbed: MainEmbed = {
          id: Math.random().toString(36).substring(2, 15),
          title,
          description,
          image,
          channelId: channel.id,
          color,
          createdAt: new Date(),
          updatedAt: new Date(),
          navigationEmbeds: selectedIds.map(id => 
            navigationEmbeds.find(nav => nav.id === id)!
          ),
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
        const discordEmbed = new EmbedBuilder()
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
        if(newEmbed.color){
          discordEmbed.setColor(newEmbed.color as ColorResolvable)
        }

        const buttonRow = new ActionRowBuilder<ButtonBuilder>();
        
        for (const button of newEmbed.buttons) {
          buttonRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`nav_${button.navigationEmbedId}`)
              .setLabel(button.label)
              .setStyle(ButtonStyle.Primary)
          );
        }

        await channel.send({
          embeds: [discordEmbed],
          components: [buttonRow]
        });

        await collection.update({ 
          content: '✅ Embed principal criado com sucesso!', 
          components: [] 
        });

      } catch (error) {
        console.error('Erro ao processar seleção:', error);
        await interaction.editReply({ 
          content: '⚠️ Tempo de seleção expirado ou ocorreu um erro.', 
          components: [] 
        });
      }

    } catch (error) {
      console.error('Erro ao criar main embed:', error);
      await interaction.reply({ 
        content: '❌ Ocorreu um erro ao criar o embed principal.', 
        ephemeral: true
      });
    }
  }
};