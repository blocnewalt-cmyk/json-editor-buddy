// Strips comments from JSONC (JSON with Comments) format
export function parseJsonWithComments(text: string): { data: unknown; sections: Map<string, string[]> } {
  const lines = text.split('\n');
  const sections = new Map<string, string[]>();
  let currentSection = 'General';
  const sectionKeys: string[] = [];
  
  // Extract sections and their keys from comments
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check for section comment like "// MODS - heavy" or "// EDITOR - crosshair"
    const sectionMatch = trimmed.match(/^\/\/\s*([A-Z]+(?:\s*-\s*[a-zA-Z\s]+)?)\s*$/);
    if (sectionMatch) {
      if (sectionKeys.length > 0) {
        sections.set(currentSection, [...sectionKeys]);
        sectionKeys.length = 0;
      }
      currentSection = sectionMatch[1].trim();
      continue;
    }
    
    // Check for key definition
    const keyMatch = trimmed.match(/^"\$([^"]+)":/);
    if (keyMatch) {
      sectionKeys.push('$' + keyMatch[1]);
    }
  }
  
  // Save last section
  if (sectionKeys.length > 0) {
    sections.set(currentSection, [...sectionKeys]);
  }
  
  // Remove comments and parse JSON
  const cleanedLines = lines.map(line => {
    // Remove single-line comments (// ...) but be careful not to remove URLs or strings
    let inString = false;
    let result = '';
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inString = !inString;
        result += char;
        i++;
        continue;
      }
      
      if (!inString && char === '/' && nextChar === '/') {
        // Found a comment, stop here
        break;
      }
      
      result += char;
      i++;
    }
    
    return result;
  });
  
  const cleanedJson = cleanedLines.join('\n');
  
  try {
    const data = JSON.parse(cleanedJson);
    return { data, sections };
  } catch (e) {
    throw new Error('Invalid JSON format: ' + (e as Error).message);
  }
}

// Serialize data back to JSON, preserving original formatting with comments
export function serializeWithComments(data: Record<string, unknown>, sections: Map<string, string[]>): string {
  const lines: string[] = ['{'];
  
  // Add version first
  if ('$bb_version' in data) {
    lines.push(`  "$bb_version": "${data.$bb_version}",`);
    lines.push('');
  }
  
  const processedKeys = new Set(['$bb_version']);
  
  sections.forEach((keys, sectionName) => {
    if (sectionName !== 'General') {
      lines.push(`  // ${sectionName}`);
    }
    
    keys.forEach((key, idx) => {
      if (processedKeys.has(key)) return;
      processedKeys.add(key);
      
      const value = data[key];
      if (value === undefined) return;
      
      const isLast = idx === keys.length - 1 && [...sections.keys()].pop() === sectionName;
      const comma = isLast ? '' : ',';
      
      // Check if this is a "parent" key (no underscore after the main name)
      const keyParts = key.replace('$', '').split('_');
      const isSubSetting = keyParts.length > 2 || (keyParts.length === 2 && !['hud', 'counter', 'timer', 'list', 'menu', 'doll', 'slots'].includes(keyParts[1]));
      
      const indent = isSubSetting ? '    ' : '  ';
      
      if (Array.isArray(value)) {
        if (value.length === 0) {
          lines.push(`${indent}"${key}": []${comma}`);
        } else {
          lines.push(`${indent}"${key}": ${JSON.stringify(value)}${comma}`);
        }
      } else if (typeof value === 'object' && value !== null) {
        lines.push(`${indent}"${key}": ${JSON.stringify(value)}${comma}`);
      } else if (typeof value === 'string') {
        lines.push(`${indent}"${key}": "${value}"${comma}`);
      } else {
        lines.push(`${indent}"${key}": ${value}${comma}`);
      }
    });
    
    lines.push('');
  });
  
  // Remove trailing comma and empty line before closing brace
  while (lines[lines.length - 1] === '') {
    lines.pop();
  }
  
  // Fix last line comma
  const lastLine = lines[lines.length - 1];
  if (lastLine.endsWith(',')) {
    lines[lines.length - 1] = lastLine.slice(0, -1);
  }
  
  lines.push('}');
  
  return lines.join('\n');
}

// Format key name for display
export function formatKeyName(key: string): string {
  return key
    .replace(/^\$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Check if a key is a "child" setting (indented under a parent)
export function isChildSetting(key: string, allKeys: string[]): boolean {
  const baseName = key.replace(/^\$/, '').split('_').slice(0, 2).join('_');
  const parentKey = '$' + baseName;
  
  return key !== parentKey && allKeys.includes(parentKey);
}
