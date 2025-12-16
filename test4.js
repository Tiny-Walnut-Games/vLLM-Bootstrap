const fs = require('fs');  
const s = fs.readFileSync('server/src/auth/routes.ts','utf8');  
console.log(s);  
