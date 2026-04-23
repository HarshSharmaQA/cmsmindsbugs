/**
 * TOON Library Test Suite
 * Demonstrates the improved functionality
 */

import { encode, decode, generateStructure, convert, isValidToon } from './toon';

// Test 1: Basic encoding with improved string escaping
console.log('=== Test 1: String Escaping ===');
const testData1 = {
  message: 'Hello "World"',
  path: 'C:\\Users\\Documents',
  multiline: 'Line 1\nLine 2\nLine 3',
  special: 'Contains, commas: and colons'
};
const encoded1 = encode(testData1);
console.log(encoded1);
console.log('\nDecoded:', decode(encoded1));

// Test 2: Tabular arrays with better formatting
console.log('\n=== Test 2: Tabular Arrays ===');
const testData2 = {
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com', active: true },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', active: false },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', active: true }
  ]
};
const encoded2 = encode(testData2);
console.log(encoded2);
console.log('\nDecoded:', JSON.stringify(decode(encoded2), null, 2));

// Test 3: Large array truncation
console.log('\n=== Test 3: Array Truncation ===');
const testData3 = {
  items: Array.from({ length: 150 }, (_, i) => ({ id: i, value: `Item ${i}` }))
};
const encoded3 = encode(testData3, { maxArrayPreview: 5 });
console.log(encoded3);

// Test 4: Nested objects with key folding
console.log('\n=== Test 4: Key Folding ===');
const testData4 = {
  user: {
    profile: {
      name: 'John Doe'
    }
  },
  settings: {
    theme: 'dark'
  }
};
const encoded4 = encode(testData4, { keyFolding: true });
console.log(encoded4);
console.log('\nDecoded:', decode(encoded4));

// Test 5: Generate structure for LLM prompts
console.log('\n=== Test 5: Structure Generation ===');
const schema = {
  bugReport: {
    title: 'bug title',
    priority: 'one of [low, medium, high, critical]',
    tags: ['tag1', 'tag2'],
    metadata: {
      browser: 'browser name',
      os: 'operating system'
    }
  }
};
const structure = generateStructure(schema);
console.log(structure);

// Test 6: Validation
console.log('\n=== Test 6: Validation ===');
const validToon = 'title: Bug Report\npriority: high';
const invalidToon = 'not valid toon format {{{';
console.log('Valid TOON:', isValidToon(validToon));
console.log('Invalid TOON:', isValidToon(invalidToon));

// Test 7: Conversion between formats
console.log('\n=== Test 7: Format Conversion ===');
const jsonStr = JSON.stringify({ name: 'Test', value: 42 });
const toonStr = convert(jsonStr, 'json', 'toon');
console.log('JSON to TOON:', toonStr);
const backToJson = convert(toonStr, 'toon', 'json');
console.log('TOON to JSON:', backToJson);

// Test 8: Complex nested structure
console.log('\n=== Test 8: Complex Nested Structure ===');
const testData8 = {
  project: 'BugScribe',
  bugs: [
    {
      id: 1,
      title: 'Login fails',
      priority: 'critical',
      consoleErrors: ['TypeError: Cannot read property', 'Network timeout'],
      metadata: {
        browser: 'Chrome 120',
        os: 'Windows 11'
      }
    },
    {
      id: 2,
      title: 'UI glitch',
      priority: 'low',
      consoleErrors: [],
      metadata: {
        browser: 'Firefox 121',
        os: 'macOS'
      }
    }
  ],
  stats: {
    total: 2,
    critical: 1,
    resolved: 0
  }
};
const encoded8 = encode(testData8);
console.log(encoded8);
console.log('\n--- Decoded ---');
console.log(JSON.stringify(decode(encoded8), null, 2));

// Test 9: Edge cases
console.log('\n=== Test 9: Edge Cases ===');
const edgeCases = {
  emptyString: '',
  nullValue: null,
  boolTrue: true,
  boolFalse: false,
  number: 42,
  float: 3.14159,
  emptyArray: [],
  emptyObject: {},
  numberString: '123',
  boolString: 'true'
};
const encoded9 = encode(edgeCases);
console.log(encoded9);
console.log('\nDecoded:', decode(encoded9));

console.log('\n=== All Tests Complete ===');
