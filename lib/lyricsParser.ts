export function processLyrics(rawLyrics: string): string {
  // 1. Limpiar espacios extra
  let text = rawLyrics.trim();

  // 2. Estandarizar etiquetas comunes del inglés al español
  // Convierte variaciones como [Chorus], (Chorus), Chorus: a [Coro]
  const tagMappings = [
    { regex: /\[?(Chorus|Estribillo)\]?:?/gi, replacement: "[Coro]" },
    { regex: /\[?Verse\s*(\d*)\]?:?/gi, replacement: "[Verso $1]" },
    { regex: /\[?(Bridge|Puente)\]?:?/gi, replacement: "[Puente]" },
    { regex: /\[?(Intro)\]?:?/gi, replacement: "[Intro]" },
    { regex: /\[?(Outro|Ending)\]?:?/gi, replacement: "[Final]" },
    { regex: /\[?(Solo)\]?:?/gi, replacement: "[Solo]" },
  ];

  tagMappings.forEach(({ regex, replacement }) => {
    text = text.replace(regex, replacement.trim());
  });

  // Limpiar espacios dentro de corchetes vacíos como [Verso ] -> [Verso]
  text = text.replace(/\[(.*?)\s+\]/g, "[$1]");

  // 3. Si ya tiene etiquetas (corchetes), asumimos que ya está estructurada
  if (text.includes("[") && text.includes("]")) {
    return text;
  }

  // 4. Heurística de Repetición: Si no hay etiquetas, intentamos adivinar el coro.
  // Separamos por estrofas (bloques separados por 2 o más saltos de línea)
  const stanzas = text.split(/\n\s*\n/);
  
  // Contamos la frecuencia de cada estrofa (ignorando mayúsculas y puntuación menor)
  const stanzaCounts = new Map<string, { count: number, original: string }>();
  
  stanzas.forEach(stanza => {
    const cleanStanza = stanza.toLowerCase().trim();
    if (cleanStanza.length < 20) return; // Ignorar líneas sueltas muy cortas
    
    if (stanzaCounts.has(cleanStanza)) {
      stanzaCounts.get(cleanStanza)!.count++;
    } else {
      stanzaCounts.set(cleanStanza, { count: 1, original: stanza.trim() });
    }
  });

  // Encontrar la estrofa más repetida
  let maxCount = 1;
  let chorusStanzaOriginal = "";
  
  stanzaCounts.forEach((data) => {
    if (data.count > maxCount) {
      maxCount = data.count;
      chorusStanzaOriginal = data.original;
    }
  });

  // Si encontramos una estrofa que se repite 2 o más veces, la etiquetamos como [Coro]
  if (maxCount >= 2 && chorusStanzaOriginal) {
    // Reconstruimos el texto inyectando [Coro] antes de esas estrofas
    const newStanzas = stanzas.map(stanza => {
      const cleanStanza = stanza.toLowerCase().trim();
      const cleanChorus = chorusStanzaOriginal.toLowerCase().trim();
      
      if (cleanStanza === cleanChorus) {
        return `[Coro]\n${stanza.trim()}`;
      }
      return stanza.trim();
    });
    
    return newStanzas.join("\n\n");
  }

  return text;
}
