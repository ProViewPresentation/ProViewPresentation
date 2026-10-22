export type ItemType = 'announcement' | 'song' | 'scripture' | 'sermon' | 'media';
export type ThemeId = 'mountain' | 'forest' | 'sand' | 'midnight' | 'lavender' | 'light';
export type User = {
  id: string;
  email: string;
  name: string;
  mode: 'cloud';
  churchName?: string;
};
export type Slide = {
  id: string;
  text: string;
  subtitle?: string;
  label?: string;
  notes?: string;
  fontSize: number;
  theme: ThemeId;
  backgroundUrl?: string;
  mediaType?: 'image' | 'video';
  credit?: string;
};
export type ServiceItem = {
  id: string;
  title: string;
  type: ItemType;
  duration: number;
  slides: Slide[];
  notes?: string;
};
export type Service = {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  theme: ThemeId;
  items: ServiceItem[];
  updatedAt: string;
};
export type Song = {
  id: string;
  title: string;
  author: string;
  copyright: string;
  ccli: string;
  lyrics: string;
  tags: string[];
};
export type Media = {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
  filename?: string;
  size: number;
  createdAt: string;
};
export type Settings = {
  churchName: string;
  name: string;
  ccliLicense: string;
  defaultTheme: ThemeId;
  defaultFontSize: number;
  wordsPerSlide: number;
};
export type WorkspaceData = {
  schemaVersion: 1;
  services: Service[];
  songs: Song[];
  media: Media[];
  settings: Settings;
};
export type LiveState = {
  active: Slide | null;
  next: Slide | null;
  serviceTitle: string;
  itemTitle: string;
  black: boolean;
  clear: boolean;
  isLive: boolean;
  startedAt: number | null;
  countdownEnd: number | null;
  updatedAt: number;
};
