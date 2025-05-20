const { statSync, readdirSync, readFileSync, watch } = require('fs');
const path = require('path');

/**
 * Lightweight Language Management for Node.js
 * Developed by Alataq · Maintained by Nerexon
 */
class LanguageManager {
  /**
   * @param {string} dirPath Path to the language JSON files directory
   * @param {string} [separator='.'] Separator used for nested keys
   */
  constructor(dirPath, separator = '.') {
    // Validate directory
    try {
      const stats = statSync(dirPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path exists but is not a directory: ${dirPath}`);
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error(`Directory does not exist: ${dirPath}`);
      }
      throw err;
    }

    this.path = dirPath;
    this.separator = separator;
    this.languages = Object.create(null);

    this.loadLanguages();
    this.watchDirectory();
  }

  /**
   * Load all JSON language files
   * @private
   */
  loadLanguages() {
    const files = readdirSync(this.path);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      this.loadFile(file);
    }
  }

  /**
   * Load a single language file
   * @param {string} file
   * @private
   */
  loadFile(file) {
    try {
      const filePath = path.join(this.path, file);
      const raw = readFileSync(filePath, 'utf8');
      const json = JSON.parse(raw);
      const locale = path.basename(file, '.json');
      this.languages[locale] = this.flatten(json);
    } catch (err) {
      console.error(`Error loading ${file}: ${err.message}`);
    }
  }

  /**
   * Watch language directory for changes and auto-reload
   * @private
   */
  watchDirectory() {
    watch(this.path, (event, filename) => {
      if (filename && filename.endsWith('.json')) {
        console.log(`Langpack.js: Reloading ${filename}...`);
        this.loadFile(filename);
      }
    });
  }

  /**
   * Get translation string
   * @param {string} locale Language code (e.g., 'en', 'fr')
   * @param {string} key Translation key (e.g., 'user.welcome')
   * @param {Object.<string, string|number>} [args] Replacement variables
   * @returns {string} Translated and formatted string
   */
  get(locale, key, args = {}) {
    const translations = this.languages[locale];
    if (!translations) throw new Error(`Locale '${locale}' not found`);
    const template = translations[key] ?? key;
    return this.replacePlaceholders(template, args);
  }

  /**
   * Flatten nested JSON structure into dot-separated keys
   * @param {object} obj
   * @param {string} [parentKey]
   * @returns {object}
   * @private
   */
  flatten(obj, parentKey = '') {
    const result = Object.create(null);
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = parentKey ? `${parentKey}${this.separator}${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(result, this.flatten(value, fullKey));
      } else {
        result[fullKey] = value?.toString() ?? '';
      }
    }
    return result;
  }

  /**
   * Replace `{placeholder}` in a string with actual values
   * @param {string} template
   * @param {object} values
   * @returns {string}
   * @private
   */
  replacePlaceholders(template, values) {
    return template.replace(/{(\w+)}/g, (match, key) => {
      if (!values.hasOwnProperty(key)) return match;
      const value = values[key];
      if (Array.isArray(value)) {
        return value
          .map(v => (typeof v === 'string' || typeof v === 'number' ? v.toString() : ''))
          .join(', ');
      }
      return value.toString();
    });
  }
}

module.exports = {
  LanguageManager
};
