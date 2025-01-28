const { statSync, readdirSync, readFileSync } = require('fs');
const path = require('path');

/**
 * Main class for managing language translations
 * @class
 */
class LanguageManager {
    /**
     * Create a LanguageManager instance
     * @param {string} path Path to directory containing JSON language files
     * @param {string} [separator='.'] Key separator for nested values
     * @throws {Error} If directory is invalid or missing
     */
    constructor(path, separator = '.') {
        // Validate directory exists
        try {
            const stats = statSync(path);
            if (!stats.isDirectory()) {
                throw new Error(`Path exists but is not a directory: ${path}`);
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Directory does not exist: ${path}`);
            }
            throw error;
        }

        /** @type {string} */
        this.path = path;
        
        /** @type {string} */
        this.separator = separator;
        
        /** @type {Object.<string, Object.<string, string>>} */
        this.languages = Object.create(null);

        this.loadLanguages();
        this.Translator = this.createTranslatorClass();
    }

    /**
     * Creates Translator class bound to this instance
     * @private
     */
    createTranslatorClass() {
        const manager = this;
        
        return class Translator {
            /**
             * Create a Translator instance
             * @param {string} locale Language locale to use
             * @throws {Error} If locale is not found
             */
            constructor(locale) {
                /** @type {Object.<string, string>} */
                this.translations = manager.languages[locale];
                
                if (!this.translations) {
                    throw new Error(`Locale '${locale}' not found`);
                }
            }

            /**
             * Get translated string with argument replacement
             * @param {string} key Translation key
             * @param {Object.<string, string|number>} [args] Replacement arguments
             * @returns {string} Translated string with replacements
             */
            get(key, args = {}) {
                const template = this.translations[key] ?? key;
                return this.replacePlaceholders(template, args);
            }

            /**
             * Replace placeholders in template string
             * @private
             */
            replacePlaceholders(template, values) {
                return template.replace(/{(\w+)}/g, (match, key) => {
                    if (!values.hasOwnProperty(key)) return match;
                    
                    const value = values[key];
                    if (Array.isArray(value)) {
                        return value
                            .map(item => {
                                if (typeof item === 'string' || typeof item === 'number') {
                                    return item.toString();
                                }
                                return ''; // Filter out invalid types
                            })
                            .join(', ');
                    }
                    return value.toString();
                });
            }
        };
    }

    /**
     * Load and process all JSON language files
     * @private
     */
    loadLanguages() {
        const files = readdirSync(this.path);
        
        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            
            try {
                const filePath = path.join(this.path, file);
                const rawData = readFileSync(filePath, 'utf8');
                const jsonData = JSON.parse(rawData);
                const locale = path.basename(file, '.json');
                
                this.languages[locale] = this.flatten(jsonData);
            } catch (error) {
                console.error(`Error loading ${file}:`, error.message);
            }
        }
    }

    /**
     * Flatten nested JSON objects
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
}

module.exports = {
    LanguageManager
};