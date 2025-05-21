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
    // Validate directory existence and type upfront for immediate feedback
    try {
      const stats = statSync(dirPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path exists but is not a directory: ${dirPath}`);
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error(`Directory does not exist: ${dirPath}`);
      }
      // Re-throw any other unexpected errors
      throw err;
    }

    this.path = dirPath;
    this.separator = separator;
    this.languages = Object.create(null);

    // Debounce map for file changes
    this.debounceMap = new Map();
    this.debounceDelay = 100; // Adjust this value if needed (milliseconds)

    // Initialize all languages and set up the watcher
    this.loadLanguages();
    this.watchDirectory();
  }

  /**
   * Recursively flattens a nested JSON object into a single-level object
   * with dot-separated keys.
   * @param {object} obj The object to flatten.
   * @param {string} separator The separator character to use for keys.
   * @param {string} [parentKey=''] The prefix for the current level of keys during recursion.
   * @returns {object} The flattened object.
   * @private
   */
  static _flatten(obj, separator, parentKey = '') {
    const result = Object.create(null);
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = parentKey ? `${parentKey}${separator}${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(result, LanguageManager._flatten(value, separator, fullKey));
      } else {
        result[fullKey] = String(value ?? '');
      }
    }
    return result;
  }

  /**
   * Replaces `{placeholder}` in a template string with corresponding values.
   * @param {string} template The string containing placeholders.
   * @param {object} values An object mapping placeholder names to their replacement values.
   * @returns {string} The string with placeholders replaced.
   * @private
   */
  static _replacePlaceholders(template, values) {
    if (!values || Object.keys(values).length === 0) {
      return template;
    }

    return template.replace(/{(\w+)}/g, (match, key) => {
      if (!Object.prototype.hasOwnProperty.call(values, key)) {
        return match;
      }
      const value = values[key];
      if (Array.isArray(value)) {
        return value.map(v => String(v ?? '')).join(', ');
      }
      return String(value ?? '');
    });
  }

  /**
   * Loads a single language file from the specified path.
   * @param {string} filename The name of the JSON file (e.g., 'en.json').
   * @private
   */
  _loadFile(filename) {
    const filePath = path.join(this.path, filename);
    try {
      const raw = readFileSync(filePath, 'utf8');
      const json = JSON.parse(raw);
      const locale = path.basename(filename, '.json');

      this.languages[locale] = LanguageManager._flatten(json, this.separator);
      console.log(`Langpack.js: Successfully loaded/reloaded "${filename}".`); // Added success log
    } catch (err) {
      console.error(`Langpack.js: Error loading or parsing "${filename}": ${err.message}`);
      delete this.languages[path.basename(filename, '.json')];
    }
  }

  /**
   * Loads all JSON language files from the configured directory.
   * @private
   */
  loadLanguages() {
    try {
      const files = readdirSync(this.path);
      for (const file of files) {
        if (file.endsWith('.json')) {
          this._loadFile(file);
        }
      }
    } catch (error) {
      console.error(`Langpack.js: Error reading language directory: ${error.message}`);
    }
  }

  /**
   * Sets up a file system watcher on the language directory to automatically
   * reload language files when they are changed, added, or removed.
   * @private
   */
  watchDirectory() {
    this.watcher = watch(this.path, (event, filename) => {
      // Only process events for JSON files.
      if (filename && filename.endsWith('.json')) {
        const locale = path.basename(filename, '.json');

        // Clear any existing debounce timeout for this file
        if (this.debounceMap.has(filename)) {
          clearTimeout(this.debounceMap.get(filename));
        }

        // Set a new debounce timeout
        const timeout = setTimeout(() => {
          this.debounceMap.delete(filename); // Remove from map once executed

          switch (event) {
            case 'change':
              // It's possible that a 'change' event fires after a 'rename' for deletion.
              // So, verify file existence before reloading.
              try {
                statSync(path.join(this.path, filename)); // Check if file still exists
                console.log(`Langpack.js: Debounced reload for "${filename}" due to change...`);
                this._loadFile(filename);
              } catch (err) {
                if (err.code === 'ENOENT') {
                    // File was deleted, ignore change event as it should have been handled by rename
                    console.log(`Langpack.js: Ignoring 'change' for deleted file "${filename}".`);
                } else {
                    console.error(`Langpack.js: Error stat-ing "${filename}" for change event: ${err.message}`);
                }
              }
              break;
            case 'rename':
              try {
                statSync(path.join(this.path, filename));
                console.log(`Langpack.js: Debounced new/renamed file "${filename}". Loading...`);
                this._loadFile(filename);
              } catch (err) {
                if (err.code === 'ENOENT') {
                  console.log(`Langpack.js: Debounced deleted file "${filename}". Removing...`);
                  delete this.languages[locale];
                } else {
                  console.error(`Langpack.js: Error checking file status for "${filename}": ${err.message}`);
                }
              }
              break;
            default:
              break;
          }
        }, this.debounceDelay); // Wait for this delay

        this.debounceMap.set(filename, timeout); // Store the timeout ID
      }
    });

    this.watcher.on('error', (error) => {
      console.error(`Langpack.js: File watcher error: ${error.message}`);
    });
  }

  /**
   * Get translation string for a specific locale and key.
   * @param {string} locale Language code (e.g., 'en', 'fr').
   * @param {string} key Translation key (e.g., 'user.welcome').
   * @param {Object.<string, string|number>} [args={}] Optional replacement variables for placeholders.
   * @returns {string} The translated and formatted string.
   * @throws {Error} If the specified locale is not found.
   */
  get(locale, key, args = {}) {
    const translations = this.languages[locale];
    if (!translations) {
      throw new Error(`Locale '${locale}' not found`);
    }

    const template = translations[key] ?? key;
    return LanguageManager._replacePlaceholders(template, args);
  }
}

module.exports = {
  LanguageManager
};