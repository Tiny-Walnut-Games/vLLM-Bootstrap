const fs = require('fs');  
const s = fs.readFileSync('client/src/pages/ChatPage.tsx','utf8');  
console.log(s.substring(s.length - 100));  
