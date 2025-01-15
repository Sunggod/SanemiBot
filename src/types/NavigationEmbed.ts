import { ColorResolvable } from "discord.js";

// types/NavigationEmbed.ts
export interface NavigationEmbed {
  id: string;
  title: string;
  description: string;
  image?: string;
  color?: ColorResolvable
  channelId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NavigationButton {
  id: string;
  label: string;
  style: 'PRIMARY' | 'SECONDARY' | 'SUCCESS' | 'DANGER';
  navigationEmbedId: string;
  position: number;
}

export interface CreateNavigationEmbedData {
  title: string;
  description: string;
  image?: string;
  channelId: string;
}

export interface UpdateNavigationEmbedData {
  title?: string;
  description?: string;
  image?: string;
}