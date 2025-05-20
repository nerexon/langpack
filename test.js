const assert = require('assert');
const path = require('path');
const { LanguageManager } = require('./src/index');

const TEST_DIR = path.join(__dirname, 'testLanguages');

function runTests() {
  try {
    const manager = new LanguageManager(TEST_DIR);

    // Test 1: Initialization
    assert.ok(manager instanceof LanguageManager, 'LanguageManager should initialize');
    console.log('✓ Initialization test passed');

    // Test 2: Load language files
    assert.ok(manager.languages.en, 'Should load en.json');
    assert.ok(manager.languages.fr, 'Should load fr.json');
    console.log('✓ Language loading test passed');

    // Test 3: Flattened nested keys
    assert.strictEqual(manager.languages.en['buttons.confirm'], 'Confirm', 'English nested key should be flattened');
    assert.strictEqual(manager.languages.fr['buttons.cancel'], 'Annuler', 'French nested key should be flattened');
    console.log('✓ Flattening test passed');

    // Test 4: Translation without arguments
    const rawEnGreeting = manager.get('en', 'greeting');
    assert.strictEqual(rawEnGreeting, 'Hello {name}!', 'Should return template string');
    console.log('✓ Basic translation retrieval test passed');

    // Test 5: Translation with arguments
    const personalizedEn = manager.get('en', 'greeting', { name: 'Alice' });
    assert.strictEqual(personalizedEn, 'Hello Alice!', 'Should insert name placeholder');
    console.log('✓ Placeholder replacement test passed');

    // Test 6: Missing translation key
    const missingFr = manager.get('fr', 'buttons.confirm');
    assert.strictEqual(missingFr, 'buttons.confirm', 'Should return key if missing translation');
    console.log('✓ Missing key fallback test passed');

    // Test 7: Invalid locale
    let threw = false;
    try {
      manager.get('de', 'greeting');
    } catch (err) {
      threw = true;
      assert.match(err.message, /Locale 'de' not found/, 'Should throw for unknown locale');
    }
    assert.ok(threw, 'Should throw error for missing locale');
    console.log('✓ Unknown locale error test passed');

    console.log('\n✅ All tests passed!');
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
}

runTests();
