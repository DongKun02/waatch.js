const client = require('superagent');
const EventEmitter = require('events');
const { ip, port, token } = require('../setting/server')

const chokidar = require('chokidar');
const awatch = chokidar.watch;

let recentTime = new Date()
let processing = false

let allFiles = []

class processingEmitter extends EventEmitter { }

let pEmitter = new processingEmitter();

setInterval(() => {
  let diff = new Date() - recentTime;

  if (diff > 3000 && processing == true) {
    processing = false;
    pEmitter.emit('endprocessing');
  }
}, 2000)

pEmitter.on('endprocessing', () => {
  let promises = [];

  allFiles.forEach(name => {
    promises.push(new Promise((resolve, reject) => {
        const queryOptions = {
        }

        client.post(`${ip}:${port}/files`)
          .query(queryOptions)
          .attach('file', name)
          .then(res => {
            console.log('file upload successful');
            resolve(res.body);
          })
          .catch(err => {
            console.error('File upload error', err);
            reject(err);
          })
      }
    )); 
  }) 

  Promise.all(promises)
  .then(() => console.log('All file upload successful'))
  .catch(err => console.log("promise all error = ", err))

    allFiles = [];
})

function watchStart(watchFolder) {
  console.log('WATCHING...')
  console.log('WATCHING FOLDER:', watchFolder)

  watch = awatch(watchFolder, {
    ignoreInitial: true,
    persistent: true,
    usePolling: true,
    interval: 100,
    binaryInterval: 300,
    awaitWriteFinish: false,
  })
  .on('add', (name, stats) => {
    if (stats.size < 2000000000)
      allFiles.push(name);
    else
      console.log("bigger thant 2GB", name);
  })
  .on('all', (event, path) => {
    if (event && event != "unlink" && event != "unlinkDir") {
      if (!processing)
        processing = true;
      recentTime = new Date();
    }
  })
  .on('change', (path, stats) => {
    console.log("change.....");
    if (stats)
      console.log(`File ${path} changed size to ${stats.size}`);
  })
}

function watchStop(watchFolder) {
  console.log('WATCH OFF.')

  watch = awatch(watchFolder, {
    ignoreInitial: true,
    persistent: true,
    usePolling: true,
    interval: 100,
    binaryInterval: 300,
    awaitWriteFinish: false,
  }).close()
}

module.exports = {
  start: (watchPath) => watchStart(watchPath),
  stop: (watchPath) => watchStop(watchPath)
}