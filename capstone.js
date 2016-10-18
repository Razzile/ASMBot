const fsn = require('fs');

let filedata = fsn.readFileSync('./lib/capstone.min.js','utf8');
eval(filedata);

module.exports = capstone;
