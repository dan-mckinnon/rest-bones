const restBones = require('../src/rest-bones.js')
const http = require('http')

let restServer = new restBones.RestServer({port:10004})
let error = false
restServer.on('stop',()=>{
    if (error){
        throw new Error(error)
    }
    process.exit(0)
})
restServer.add('GET','/',{handler:'function'},function(data){
    console.log('success')
    restServer.stop()
    
})
restServer.start()

http.request('http://localhost:10004/').end()

setTimeout(()=>{    
    error = 'Endpoint "/" never executed.'
    restServer.stop()
},5000)