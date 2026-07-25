import Dexie, { Table } from 'dexie';

export interface Song {
  id?: number;
  title: string;
  artist: string;
  lyrics: string;
  referenceKey?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Setlist {
  id?: number;
  title: string;
  date?: number;
  songs: number[]; // Array of Song IDs
  createdAt: number;
  updatedAt: number;
}

export class SongbookDatabase extends Dexie {
  songs!: Table<Song, number>;
  setlists!: Table<Setlist, number>;

  constructor() {
    super('SongbookDB');
    this.version(1).stores({
      songs: '++id, title, artist, createdAt',
      setlists: '++id, title, createdAt'
    });
  }
}

export const db = new SongbookDatabase();
