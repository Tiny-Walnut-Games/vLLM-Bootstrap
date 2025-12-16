const fs = require('fs');  
const s = fs.readFileSync('server/src/middleware/auth.ts','utf8');  
console.log(s);  
