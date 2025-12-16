const fs = require('fs');  
const s = fs.readFileSync('server/src/types/index.ts','utf8');  
console.log(s);  
