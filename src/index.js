const fs = require('fs');

class languageManager {
    /**
     * 
     * @param {String} path Path of the directory where the JSON files are located.
     */
    constructor(path) {
        try {
            const stats = fs.statSync(path);
            if (!stats.isDirectory()) {
                throw new Error(`Path exists but is not a directory: ${path}`);
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Directory does not exist: ${path}`);
            }
            throw error; // Re-throw other unexpected errors
        }
        this.path = path;
    }
}

module.exports = {
    languageManager
};