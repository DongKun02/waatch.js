const client = require('superagent');
const express = require('express')
const app = express()
const os = require('os')
const ifaces = os.networkInterfaces();
const { start, stop } = require('./custom_modules/maestro-watch')
const { ip, port, token } = require('./setting/maestro')


const ServerPort = 8000

const successResponse = (res, message) => {  
  return res.status(200).json({ message, code: 200})
}

const errorResponse = (res, message) => {  
  return res.status(404).json({ message, code: 404 })
}

app.get('/server/on', (req, res) => {
  try {
    start(req.query.dirpath)
    successResponse(res, 'MAESTRO WATCH SERVER ON')
  } catch (err) {
    errorResponse(res, err.code)
  }

})

app.get('/server/off', (req, res) => {
  try {
    stop()
    successResponse(res, 'MAESTRO WATCH SERVER OFF')
  } catch (err) {
    errorResponse(res, err.code)
  }
})

Object.keys(ifaces).forEach(ifname => {
  ifaces[ifname].forEach(iface => {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      return;
    }
      console.log(ifname, iface.address, ServerPort);
      let myIp = iface.address;

      client.get(`http://${ip}:${port}/remotes?accessToken=${token}`)
        .then(res => {
          res.body.forEach(item => {
            if (item.ip === myIp && item.port === ServerPort && item.active) {
              return start(item.dirPath)
            }
          })   
      })
      .catch((err)=>{
        console.log("get remote ipinfo failed : ", err);
      })
  });
});


app.listen(ServerPort, () => console.log(`Express app listening on port ${ServerPort}!`))