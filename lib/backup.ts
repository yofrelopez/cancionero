import { db } from './db';

export async function exportDatabaseToJSON(): Promise<string> {
  const songs = await db.songs.toArray();
  const setlists = await db.setlists.toArray();
  
  const data = {
    songs,
    setlists,
    exportedAt: Date.now()
  };
  
  return JSON.stringify(data, null, 2);
}

export function downloadBackup(jsonString: string, filename = 'songbook-backup.json') {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importDatabaseFromJSON(jsonString: string): Promise<void> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.songs || !data.setlists) {
      throw new Error("Invalid backup format");
    }
    
    await db.transaction('rw', db.songs, db.setlists, async () => {
      // Clear existing to avoid conflicts, or handle merging strategy
      await db.songs.clear();
      await db.setlists.clear();
      
      if (data.songs.length > 0) {
         await db.songs.bulkAdd(data.songs);
      }
      if (data.setlists.length > 0) {
         await db.setlists.bulkAdd(data.setlists);
      }
    });
  } catch (error) {
    console.error("Failed to import database:", error);
    throw error;
  }
}
