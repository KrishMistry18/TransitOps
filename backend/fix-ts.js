const fs = require('fs');
const path = require('path');

const modelsDir = path.join(process.cwd(), 'src/models');
const files = fs.readdirSync(modelsDir);

files.forEach(file => {
  const fp = path.join(modelsDir, file);
  let content = fs.readFileSync(fp, 'utf8');
  content = content.replace(/transform: \(doc, ret\) => {/g, 'transform: (doc: any, ret: any) => {');
  fs.writeFileSync(fp, content);
});

const stubsPath = path.join(process.cwd(), 'src/controllers/stubsController.ts');
let stubs = fs.readFileSync(stubsPath, 'utf8');
stubs = stubs.replace(/id: (\d+)/g, 'id: "$1"');
stubs = stubs.replace(/vehicleId: (\d+)/g, 'vehicleId: "$1"');
stubs = stubs.replace(/driverId: (\d+)/g, 'driverId: "$1"');
stubs = stubs.replace(/tripId: (\d+)/g, 'tripId: "$1"');
fs.writeFileSync(stubsPath, stubs);
