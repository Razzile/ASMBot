const fsn = require('fs');

let filedata = fsn.readFileSync('./lib/keystone.min.js','utf8');
eval(filedata);

module.exports = ks;
