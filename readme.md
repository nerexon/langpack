```markdown
# Langpack.js  
**Lightweight Language Management for Node.js**  
Developed by Alataq · Maintained by Nerexon  
[Project Page](https://nerexon.com/page/en/langpack.html) · [Company Website](https://nerexon.com/)  

---

## Installation  
```bash  
npm install langpack.js  
```  

---

## Basic Usage  
1. **Create a `languages` directory** with JSON files (e.g., `en.json`, `fr.json`)  
2. **Initialize the manager**:  
```javascript
const { LanguageManager } = require('langpack.js');
const manager = new LanguageManager('./languages');
```  
3. **Use translations**:  
```javascript
const en = new manager.Translator('en');
const fr = new manager.Translator('fr');

console.log(en.get('greeting')); // "Hello"
console.log(fr.get('user.welcome', {name: 'Pierre'})); // "Bienvenue Pierre !"
```  

---

## Language File Examples  
`/languages/en.json`  
```json
{
  "greeting": "Hello",
  "user": {
    "welcome": "Welcome {name}!",
    "notifications": "You have {count} new messages"
  }
}
```  

`/languages/fr.json`  
```json
{
  "greeting": "Bonjour",
  "user": {
    "welcome": "Bienvenue {name} !",
    "notifications": "Vous avez {count} nouveaux messages"
  }
}
```  

---

## Key Features  
- 📂 **Automatic File Loading**: Loads all `.json` files from a directory  
- 🔍 **Dot Notation Support**: Access nested keys like `user.welcome`  
- 🛠 **Variable Replacement**: Use `{variable}` syntax in translations  
- ⚡ **Zero Dependencies**: Pure Node.js implementation  

---

## API Documentation  
### `new LanguageManager(directoryPath, [separator = '.'])`  
| Param | Description |  
|-------|-------------|  
| `directoryPath` | Path to language files directory |  
| `separator` | Key separator for nested objects (default: `.`) |  

### `Translator.get(key, [variables])`  
```javascript
en.get('user.notifications', {count: 5});
// Returns "You have 5 new messages"
```  

---

## Error Handling  
- Throws error if directory doesn't exist  
- Returns original key if translation missing  
- Silent failure for invalid JSON files (logs to console)  

---

## License  
**ISC License**  
Copyright © Nerexon  
```