/**
 * Token-Oriented Object Notation (TOON) Encoder, Decoder, and Generator
 * Optimized for token efficiency and LLM communication.
 */

export interface ToonOptions {
  indent?: number;
  keyFolding?: boolean;
  maxArrayPreview?: number;
  compactPrimitives?: boolean;
}

/**
 * Encodes JSON-serializable data into TOON format.
 * Improvements:
 * - Better string escaping
 * - Nested object handling
 * - Compact mode for primitives
 * - Array preview limits
 */
export function encode(value: unknown, options: ToonOptions = {}, level: number = 0): string {
  const { 
    indent = 2, 
    keyFolding = true, 
    maxArrayPreview = 100,
    compactPrimitives = true 
  } = options;
  const pad = ' '.repeat(level * indent);

  // Handle primitives
  if (value === null) return 'null';
  if (value === undefined) return 'null';
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'number') {
    if (!isFinite(value)) return 'null';
    return value.toString();
  }
  
  if (typeof value === 'string') {
    // Enhanced string quoting logic
    const needsQuotes = 
      value === '' || 
      /[ ,:{}\[\]\n\r\t]/.test(value) || 
      /^(true|false|null)$/i.test(value) || 
      !isNaN(Number(value)) ||
      value.startsWith('"') ||
      value.includes('\\');
    
    if (needsQuotes) {
      // Escape special characters
      const escaped = value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return `"${escaped}"`;
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';

    // Limit array preview for large arrays
    const previewLength = Math.min(value.length, maxArrayPreview);
    const previewValue = value.slice(0, previewLength);
    const truncated = value.length > maxArrayPreview;

    // Tabular array check (uniform objects)
    const first = previewValue[0];
    if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
      const keys = Object.keys(first).filter(k => first[k] !== undefined);
      const isUniform = previewValue.every(item => 
        typeof item === 'object' && 
        item !== null && 
        !Array.isArray(item) && 
        keys.every(k => k in item)
      );

      if (isUniform && keys.length > 0) {
        const header = `[${value.length}]{${keys.join(',')}}:`;
        const rows = previewValue.map(item => {
          const rowValues = keys.map(k => {
            const val = item[k];
            // Enhanced quoting for tabular values
            if (val === null || val === undefined) return 'null';
            if (typeof val === 'string' && (val === '' || /[ ,\n\r\t]/.test(val) || val.includes('"'))) {
              return `"${val.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
            }
            if (typeof val === 'object') return JSON.stringify(val);
            return String(val);
          });
          return `${' '.repeat((level + 1) * indent)}${rowValues.join(',')}`;
        });
        
        const result = `${header}\n${rows.join('\n')}`;
        return truncated ? `${result}\n${' '.repeat((level + 1) * indent)}... (${value.length - previewLength} more)` : result;
      }
    }

    // Compact primitive arrays
    const isPrimitive = previewValue.every(v => 
      v === null || 
      typeof v === 'string' || 
      typeof v === 'number' || 
      typeof v === 'boolean'
    );
    
    if (isPrimitive && compactPrimitives) {
      const encoded = previewValue.map(v => encode(v, options, level + 1)).join(',');
      const suffix = truncated ? ` ... (${value.length} total)` : '';
      return `[${value.length}]: ${encoded}${suffix}`;
    }

    // Complex array with nested objects
    const items = previewValue.map(v => {
      const encoded = encode(v, options, level + 1);
      return `${' '.repeat((level + 1) * indent)}${encoded}`;
    });
    
    if (truncated) {
      items.push(`${' '.repeat((level + 1) * indent)}... (${value.length - previewLength} more items)`);
    }
    
    return `[${value.length}]:\n${items.join('\n')}`;
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value).filter(([_, v]) => v !== undefined);
    if (entries.length === 0) return '{}';

    const lines = entries.map(([k, v]) => {
      // Key Folding: if value is an object with only one key, merge them
      if (keyFolding && typeof v === 'object' && v !== null && !Array.isArray(v)) {
        const subEntries = Object.entries(v).filter(([_, sv]) => sv !== undefined);
        if (subEntries.length === 1) {
          const [subK, subV] = subEntries[0];
          return encode({ [`${k}.${subK}`]: subV }, options, level);
        }
      }

      const encodedVal = encode(v, options, level + 1);
      
      // Multi-line values get indented
      if (encodedVal.includes('\n')) {
        const indentedVal = encodedVal.split('\n')
          .map((line, idx) => idx === 0 ? line : `${' '.repeat((level + 1) * indent)}${line}`)
          .join('\n');
        return `${k}:\n${' '.repeat((level + 1) * indent)}${indentedVal}`;
      }
      
      return `${k}: ${encodedVal}`;
    });

    return lines.join(`\n${pad}`);
  }

  // Fallback for unknown types
  return String(value);
}

/**
 * Decodes a TOON string back into a JSON object.
 * Improvements:
 * - Better error handling
 * - Support for nested structures
 * - Handle truncated arrays
 * - Improved string unescaping
 */
export function decode(input: string): unknown {
  if (!input || typeof input !== 'string') return null;
  
  try {
    const lines = input.trim().split('\n');
    const result: Record<string, unknown> = {};
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip empty lines and truncation markers
      if (!trimmed || trimmed.startsWith('...')) { 
        i++; 
        continue; 
      }

      // Tabular Array: [N]{a,b,c}: or key[N]{a,b,c}:
      const tabularMatch = trimmed.match(/^(?:(.+?))?\[(\d+)\]\{(.+?)\}:$/);
      if (tabularMatch) {
        const [_, key, count, fieldsStr] = tabularMatch;
        const fields = fieldsStr.split(',').map(f => f.trim());
        const n = parseInt(count);
        const items: Record<string, unknown>[] = [];
        i++;
        
        for (let j = 0; j < n && i < lines.length; j++, i++) {
          const rowLine = lines[i].trim();
          if (rowLine.startsWith('...')) break; // Handle truncation
          
          const rowValues = parseCSVRow(rowLine);
          const item: Record<string, unknown> = {};
          fields.forEach((f, idx) => {
            if (idx < rowValues.length) {
              item[f] = castValue(rowValues[idx]);
            }
          });
          items.push(item);
        }
        
        if (key) {
          result[key] = items;
        } else {
          return items; // Root-level array
        }
        continue;
      }

      // List Array: [N]: val1,val2,val3 or key[N]: val1,val2,val3
      const listMatch = trimmed.match(/^(?:(.+?))?\[(\d+)\]:\s*(.+)$/);
      if (listMatch) {
        const [_, key, count, valuesStr] = listMatch;
        
        // Remove truncation suffix if present
        const cleanValues = valuesStr.replace(/\s*\.\.\.\s*\(\d+\s+total\)$/, '');
        const values = parseCSVRow(cleanValues).map(castValue);
        
        if (key) {
          result[key] = values;
        } else {
          return values; // Root-level array
        }
        i++;
        continue;
      }

      // Key-Value: key: value
      const kvMatch = trimmed.match(/^(.+?):\s*(.+)$/);
      if (kvMatch) {
        const [_, key, value] = kvMatch;
        
        // Handle dotted keys (key folding)
        if (key.includes('.')) {
          const parts = key.split('.');
          let current: any = result;
          for (let p = 0; p < parts.length - 1; p++) {
            if (!current[parts[p]]) current[parts[p]] = {};
            current = current[parts[p]];
          }
          current[parts[parts.length - 1]] = castValue(value);
        } else {
          result[key] = castValue(value);
        }
        i++;
        continue;
      }

      // Multi-line Object or Array: key:
      const objMatch = trimmed.match(/^(.+?):$/);
      if (objMatch) {
        const key = objMatch[1];
        
        // Collect indented lines
        const subLines: string[] = [];
        const baseIndent = line.length - line.trimStart().length;
        i++;
        
        while (i < lines.length) {
          const nextLine = lines[i];
          const nextIndent = nextLine.length - nextLine.trimStart().length;
          
          // Stop if we hit a line at the same or lower indentation level
          if (nextLine.trim() && nextIndent <= baseIndent) {
            break;
          }
          
          subLines.push(nextLine);
          i++;
        }
        
        if (subLines.length > 0) {
          const decoded = decode(subLines.join('\n'));
          
          // Handle dotted keys
          if (key.includes('.')) {
            const parts = key.split('.');
            let current: any = result;
            for (let p = 0; p < parts.length - 1; p++) {
              if (!current[parts[p]]) current[parts[p]] = {};
              current = current[parts[p]];
            }
            current[parts[parts.length - 1]] = decoded;
          } else {
            result[key] = decoded;
          }
        }
        continue;
      }

      // If we can't parse the line, skip it
      i++;
    }

    // If result is empty and we only have one value, return it directly
    const keys = Object.keys(result);
    if (keys.length === 0) return null;
    if (keys.length === 1 && keys[0] === '') return result[''];
    
    return result;
  } catch (error) {
    console.error('TOON decode error:', error);
    return null;
  }
}

/**
 * Generates a TOON structure template for LLM prompts.
 * Example: generateStructure({ name: "person name", tags: ["tag1"] })
 * Returns:
 * name: <person name>
 * tags[N]: <tag1>
 */
export function generateStructure(schema: any, options: ToonOptions = {}, level: number = 0): string {
  const { indent = 2 } = options;
  const pad = ' '.repeat(level * indent);

  if (Array.isArray(schema)) {
    const first = schema[0];
    if (typeof first === 'object' && first !== null) {
      const keys = Object.keys(first);
      return `[N]{${keys.join(',')}}:\n${' '.repeat((level + 1) * indent)}<${keys.map(k => first[k]).join('>,<')}>`;
    }
    return `[N]: <${schema[0]}>`;
  }

  if (typeof schema === 'object' && schema !== null) {
    const entries = Object.entries(schema);
    return entries.map(([k, v]) => {
      const sub = generateStructure(v, options, level + 1);
      if (sub.includes('\n')) {
        return `${k}:\n${sub}`;
      }
      return `${k}: <${v}>`;
    }).join(`\n${pad}`);
  }

  return `<${schema}>`;
}

/**
 * Validates if a string is valid TOON format
 */
export function isValidToon(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  
  try {
    const decoded = decode(input);
    return decoded !== null;
  } catch {
    return false;
  }
}

/**
 * Converts between JSON and TOON formats
 */
export function convert(input: string, from: 'json' | 'toon', to: 'json' | 'toon', options?: ToonOptions): string {
  try {
    if (from === to) return input;
    
    if (from === 'json' && to === 'toon') {
      const parsed = JSON.parse(input);
      return encode(parsed, options);
    }
    
    if (from === 'toon' && to === 'json') {
      const decoded = decode(input);
      return JSON.stringify(decoded, null, 2);
    }
    
    throw new Error(`Invalid conversion: ${from} to ${to}`);
  } catch (error) {
    throw new Error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parses a CSV row with proper quote handling
 */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let escapeNext = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (escapeNext) {
      // Handle escape sequences
      switch (char) {
        case 'n': current += '\n'; break;
        case 'r': current += '\r'; break;
        case 't': current += '\t'; break;
        case '\\': current += '\\'; break;
        case '"': current += '"'; break;
        default: current += char;
      }
      escapeNext = false;
    } else if (char === '\\') {
      escapeNext = true;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Casts a string value to its appropriate type
 */
function castValue(val: string): unknown {
  if (!val) return null;
  
  val = val.trim();
  
  // Handle quoted strings with unescaping
  if (val.startsWith('"') && val.endsWith('"')) {
    return val
      .slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
  
  // Handle booleans
  if (val === 'true') return true;
  if (val === 'false') return false;
  
  // Handle null
  if (val === 'null') return null;
  
  // Handle numbers
  if (!isNaN(Number(val)) && val !== '') {
    const num = Number(val);
    if (isFinite(num)) return num;
  }
  
  // Try parsing as JSON for objects/arrays
  if ((val.startsWith('{') && val.endsWith('}')) || (val.startsWith('[') && val.endsWith(']'))) {
    try {
      return JSON.parse(val);
    } catch {
      // Fall through to return as string
    }
  }
  
  return val;
}
