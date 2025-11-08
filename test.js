const fs = require('fs');  
const s = fs.readFileSync('server/src/auth/storage.ts','utf8');  
console.log(s);  
