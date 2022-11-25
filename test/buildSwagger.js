const { writeFileSync } = require('fs-extra');
const data = require('../test.json');

let num = 0;
function makePath() {
  const defaultPath = JSON.parse(JSON.stringify(data.paths['/']));
  num += 1;
  return {
    path: '/g' + num,
    v: defaultPath,
  };
}

for (let i = 0; i < 10000; i++) {
  const { path, v } = makePath();
  data.paths[path] = v;
}

writeFileSync('./buildSwagger1w.json', JSON.stringify(data));
