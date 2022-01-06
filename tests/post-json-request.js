const restBones = require('../src/rest-bones.js')
const http = require('http')

let restServer = new restBones.RestServer({port:10004})
let error = true
restServer.on('stop',()=>{
    if (error){
        throw new Error(error)
    }
    process.exit(0)
})
let postIndex = 0
restServer.add('POST','/mypost',{deserializer:'json',serializer:'json-merge',handler:'function'},function(data){
    return {
        ret:`Hello ${data.message}`,
        num:postIndex++
    }   
})

restServer.add('POST','/mypost',{handler:'function'},function(data){
    return {
        squareroot:Math.sqrt(data.n)        
    }   
})

restServer.start()


setTimeout(()=>{    
    error = 'Endpoint "/mypost" never executed.'
    restServer.stop()
},5000)

let r = http.request(
    {
        method:"POST",
        hostname:"localhost",
        port:10004,
        path:'/mypost'
    },
    (request)=>{
    let data = ''    
    request.on('data',(newData)=>{
        data += newData
    })
    request.on('close',()=>{
        restServer.stop()
        let dataObject = JSON.parse(data.toString())
        if ( dataObject.ret ==='Hello world' && dataObject.num >= 0 && dataObject.squareroot == 8){
            error = false
        } else {
            error = `recieved corrupted response: excpected "{ret:'Hello world',num:0,squareroot:8}" and got "${data}"`
        }
        
    })
})
r.write(JSON.stringify({n:64,message:`world`}))
r.end()