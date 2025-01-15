// types/MainEmbed.ts
import { NavigationEmbed } from './NavigationEmbed';

export interface MainEmbed {
  id: string;
  title: string;
  description: string;
  image?: string;
  color?:string;
  channelId: string;
  createdAt: Date;
  updatedAt: Date;
  navigationEmbeds?: NavigationEmbed[];
  buttons:MainEmbedButton[]
}

export interface MainEmbedButton {
  id: string;
  label: string;
  style: 'PRIMARY' | 'SECONDARY' | 'SUCCESS' | 'DANGER';
  mainEmbedId: string;
  navigationEmbedId: string;
  position: number;
}

export interface CreateMainEmbedData {
  title: string;
  description: string;
  image?: string;
  channelId: string;
}

export interface UpdateMainEmbedData {
  title?: string;
  description?: string;
  image?: string;
}

export interface MainEmbedWithNavigation extends MainEmbed {
  buttons: MainEmbedButton[];
  navigationEmbeds: NavigationEmbed[];
}