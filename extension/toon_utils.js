/**
 * Token-Oriented Object Notation (TOON) Encoder, Decoder, and Generator
 * Optimized for token efficiency and LLM communication.
 */

// We use window scope for standard scripts, or global scope for service workers
const toon = {
    /**
     * Encodes JSON-serializable data into TOON format.
     */
    encode: function (value, options = {}, level = 0) {
        const { indent = 2, keyFolding = true } = options;
        const pad = ' '.repeat(level * indent);

        if (value === null) return 'null';
        if (typeof value === 'boolean') return value.toString();
        if (typeof value === 'number') return value.toString();

        if (typeof value === 'string') {
            // Quote if necessary
            if (value === '' || /[ ,:{}\[\]\n]/.test(value) || /^(true|false|null)$/.test(value) || !isNaN(Number(value))) {
                return `"${value.replace(/"/g, '\\"')}"`;
            }
            return value;
        }

        if (Array.isArray(value)) {
            if (value.length === 0) return '[]';

            // Tabular array check (uniform objects)
            const first = value[0];
            if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
                const keys = Object.keys(first);
                const isUniform = value.every(item =>
                    typeof item === 'object' &&
                    item !== null &&
                    !Array.isArray(item) &&
                    Object.keys(item).length === keys.length &&
                    keys.every(k => k in item)
                );

                if (isUniform) {
                    const header = `[${value.length}]{${keys.join(',')}}:`;
                    const rows = value.map(item => {
                        const rowValues = keys.map(k => {
                            const val = item[k];
                            // Minimal quoting for tabular values
                            if (typeof val === 'string' && (val === '' || /[ ,\n]/.test(val))) {
                                return `"${val.replace(/"/g, '\\"')}"`;
                            }
                            return String(val);
                        });
                        return `${' '.repeat((level + 1) * indent)}${rowValues.join(',')}`;
                    });
                    return `${header}\n${rows.join('\n')}`;
                }
            }

            // List array fallback
            const isPrimitive = value.every(v => typeof v !== 'object' || v === null);
            if (isPrimitive) {
                return `[${value.length}]: ${value.map(v => toon.encode(v, options, level + 1)).join(',')}`;
            }

            return `[${value.length}]:\n${value.map(v => `${' '.repeat((level + 1) * indent)}${toon.encode(v, options, level + 1)}`).join('\n')}`;
        }

        if (typeof value === 'object') {
            const entries = Object.entries(value);
            if (entries.length === 0) return '{}';

            return entries.map(([k, v]) => {
                // Key Folding: if value is an object with only one key, merge them
                if (keyFolding && typeof v === 'object' && v !== null && !Array.isArray(v)) {
                    const subEntries = Object.entries(v);
                    if (subEntries.length === 1) {
                        const [subK, subV] = subEntries[0];
                        return toon.encode({ [`${k}.${subK}`]: subV }, options, level);
                    }
                }

                const encodedVal = toon.encode(v, options, level + 1);
                if (encodedVal.includes('\n')) {
                    return `${k}:\n${encodedVal}`;
                }
                return `${k}: ${encodedVal}`;
            }).join(`\n${pad}`);
        }

        return String(value);
    },

    /**
     * Decodes a TOON string back into a JSON object.
     */
    decode: function (input) {
        if (!input || typeof input !== 'string') return null;
        // If it looks like JSON, parse it as JSON
        if (input.trim().startsWith('{') || input.trim().startsWith('[')) {
            try { return JSON.parse(input); } catch (e) { }
        }

        const lines = input.trim().split('\n');
        const result = {};

        let i = 0;
        while (i < lines.length) {
            const line = lines[i].trim();
            if (!line) { i++; continue; }

            // Tabular Array: key[N]{a,b,c}:
            const tabularMatch = line.match(/^(.+?)\[(\d+)\]\{(.+?)\}:$/);
            if (tabularMatch) {
                const [_, key, count, fieldsStr] = tabularMatch;
                const fields = fieldsStr.split(',');
                const n = parseInt(count);
                const items = [];
                i++;
                for (let j = 0; j < n && i < lines.length; j++, i++) {
                    const rowValues = this.parseCSVRow(lines[i].trim());
                    const item = {};
                    fields.forEach((f, idx) => {
                        item[f] = this.castValue(rowValues[idx]);
                    });
                    items.push(item);
                }
                result[key] = items;
                continue;
            }

            // Key-Value: key: value
            const kvMatch = line.match(/^(.+?): (.+)$/);
            if (kvMatch) {
                const [_, key, value] = kvMatch;
                result[key] = this.castValue(value);
                i++;
                continue;
            }

            // Multi-line Object (simplified)
            const objMatch = line.match(/^(.+?):$/);
            if (objMatch) {
                const key = objMatch[1];
                // Collect indented lines
                const subLines = [];
                i++;
                while (i < lines.length && (lines[i].startsWith(' ') || !lines[i].trim())) {
                    subLines.push(lines[i]);
                    i++;
                }
                result[key] = this.decode(subLines.join('\n'));
                continue;
            }

            i++;
        }

        return result;
    },

    parseCSVRow: function (row) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    },

    castValue: function (val) {
        if (!val) return null;
        val = val.trim();
        if (val.startsWith('"') && val.endsWith('"')) return val.slice(1, -1).replace(/\\"/g, '"');
        if (val === 'true') return true;
        if (val === 'false') return false;
        if (val === 'null') return null;
        if (!isNaN(Number(val))) return Number(val);
        return val;
    }
};

if (typeof globalThis !== 'undefined') {
    globalThis.toon = toon;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = toon;
}
