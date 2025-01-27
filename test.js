const assert = require('assert');
const { LanguageManager } = require('./src/index');
const path = require('path');

// Sample directory structure:
// testLanguages/
// ├── en.json
// └── fr.json
const TEST_DIR = path.join(__dirname, 'testLanguages');

// Create these files manually in testLanguages/
// en.json:
// {
//   "greeting": "Hello {name}!",
//   "buttons": {
//     "cancel": "Cancel",
//     "confirm": "Confirm"
//   }
// }

// fr.json:
// {
//   "greeting": "Bonjour {name} !",
//   "buttons": {
//     "cancel": "Annuler"
//   }
// }

function runTests() {
  try {
    const manager = new LanguageManager(TEST_DIR);
    
    // Test 1: Basic initialization
    assert.ok(manager instanceof LanguageManager, 'Should create manager instance');
    console.log('✓ Manager initialization test passed');

    // Test 2: Translation loading
    assert.ok(manager.languages.en, 'Should load English translations');
    assert.ok(manager.languages.fr, 'Should load French translations');
    console.log('✓ Translation loading test passed');

    // Test 3: Nested key flattening
    assert.equal(manager.languages.en['buttons.confirm'], 'Confirm', 'Should flatten nested keys');
    console.log('✓ Key flattening test passed');

    // Test 4: Translator creation
    const enTranslator = new manager.Translator('en');
    const frTranslator = new manager.Translator('fr');
    assert.ok(enTranslator.get, 'Should create English translator');
    assert.ok(frTranslator.get, 'Should create French translator');
    console.log('✓ Translator creation test passed');

    // Test 5: Simple translation
    assert.equal(enTranslator.get('greeting'), 'Hello {name}!', 'Should return raw template');
    console.log('✓ Simple translation test passed');

    // Test 6: Argument replacement
    assert.equal(
      enTranslator.get('greeting', { name: 'Alice' }),
      'Hello Alice!',
      'Should replace placeholders'
    );
    console.log('✓ Argument replacement test passed');

    // Test 7: Missing key handling
    assert.equal(
      frTranslator.get('buttons.confirm'),
      'buttons.confirm',
      'Should return key for missing translations'
    );
    console.log('✓ Missing key handling test passed');

    // Test 8: Error handling
    let errorThrown = false;
    try {
      new manager.Translator('de');
    } catch (e) {
      errorThrown = true;
      assert.match(e.message, /Locale 'de' not found/, 'Should throw for missing locale');
    }
    assert.ok(errorThrown, 'Should throw error for invalid locale');
    console.log('✓ Error handling test passed');

    console.log('\nAll tests passed!');
  } catch (error) {
    console.error('\nTest failed:', error.message);
    process.exit(1);
  }
}

runTests();