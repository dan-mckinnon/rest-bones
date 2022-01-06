let http = require('http')
let httpBones = require('http-bones')
let fs = require('fs')

class GetHttpMethod extends httpBones.HttpMethod{
    constructor(){
        super('GET')
    }
    async getData(request){
        let queryIndex = request.url.indexOf('?')
        return queryIndex != -1 ? decodeURI(request.url.substring(queryIndex+1)): ''
    }
}
class PostHttpMethod extends httpBones.HttpMethod{
    constructor(){
        super('POST')
    }
    getDataPromise(request){
        return new Promise((resolve,reject)=>{
            let data = []
            request.on('data',(chunk)=>{
                data.push(chunk)
            })
            request.on('end',()=>{
                let rawData = Buffer.concat(data).toString()            
                resolve(rawData)
            })    
            request.on('error',(e)=>{
                reject(e)
            })
        })
    }
    async getData(request){
        return await this.getDataPromise(request)
    }
}
class PassThroughDeserializer extends httpBones.Deserializer{
    constructor(){
        super('default')
    }
    async deserialize(rawData){
        return rawData
    }
}
class JSONDeserializer extends httpBones.Deserializer{
    constructor(){
        super('json')        
    }
    async deserialize(rawData){
        let dataObject = null
        try{
            dataObject = JSON.parse(rawData)
        } catch(e){
            console.log(e)
            dataObject = {}
        }
        return dataObject
    }
}
class JoinSerializer extends httpBones.Serializer{
    constructor(){
        super('default')
    }
    async serialize(dataList){
        return dataList.join("\n")
    }
}

class MergeJSONSerializer extends httpBones.Serializer{
    constructor(){
        super('json-merge')
    }
    async serialize(dataList){
        let mergedData = {}
        for(let row of dataList ){
            mergedData = {...mergedData,...row}
        }
        return JSON.stringify(mergedData)
    }
}

class ListJSONSerializer extends httpBones.Serializer{
    constructor(){
        super('json')
    }

    async serialize(dataList){
        return JSON.stringify(dataList)        
    }
}

class ListTextAsJSONSerializer extends httpBones.Serializer{
    constructor(){
        super('json-text')
    }
    async serialize(dataList){
        return JSON.stringify(dataList)        
    }
}

class FunctionHandler extends httpBones.Handler{
    constructor(){
        super('function')
    }
    async handlerImplementation(endPointObject,dataObject){
        return await endPointObject(dataObject)
    }
}
class FolderHandler extends httpBones.Handler{
    constructor(){
        super('folder')
    }
    async handlerImplementation(endPointObject,dataObject){        
    }
}

class URLHandler extends httpBones.Handler{
    constructor(){
        super('url')
    }
    async handlerImplementation(endPointObject,dataObject){        
    }  
}
class FileHandler extends httpBones.Handler{
    constructor(){        
        super('file')
    }
    async handlerImplementation(endPointObject,dataObject){        
    }    
}
class DetectHandler extends httpBones.Handler{
    #functionHandler = null
    #fileHandler = null
    #folderHandler = null
    #urlHandler = null

    constructor(server){
        super('default')
        this.#functionHandler = new FunctionHandler()
        this.#fileHandler = new FileHandler()
        this.#folderHandler = new FolderHandler()
        this.#urlHandler = new URLHandler()
    }
    async handlerImplementation(endPointObject,dataObject){
        if ( typeof(endPointObject) === 'string' ){
            let colonPosition = endPointObject.indexOf(':')
            if ( colonPosition != -1 ){
                //This is a URL
                return await this.#urlHandler(endPointObject,dataObject)
            } 

            if ( fs.existsSync(endPointObject)){
                //This is a file or folder
                let stat = fs.lstatSync(endPointObject)
                if ( stat.isDirectory() ){
                    return await this.#folderHandler(endPointObject,dataObject)
                } else if (stat.isFile() ){
                    return await this.#fileHandler(endPointObject,dataObject)
                } else {
                    throw new Error(`Unknown endpoint function, file, folder, or script "${endPointObject}"`)
                }
    
            } else if ( typeof(endPointObject) === 'function'){
                return await this.#functionHandler(endPointObject,dataObject)
            }
            throw new Error(`Cannot detect type of endpoint handler for "${endPointObject}"`)            
        }
    }
}


class RestServer extends httpBones.Server{
    
    constructor(options){
        super(options)

        //Http Methods
        this.addHttpMethod(new GetHttpMethod())
        this.addHttpMethod(new PostHttpMethod())

        //Ways of compiling and serializing responses
        this.addSerializer(new JoinSerializer())
        this.addSerializer(new ListJSONSerializer())
        this.addSerializer(new MergeJSONSerializer())
        this.addSerializer(new ListTextAsJSONSerializer())

        //Ways of requesting data
        this.addDeserializer(new PassThroughDeserializer())
        this.addDeserializer(new JSONDeserializer())

        //Ways of handling end point objects
        this.addHandler(new FunctionHandler())
        this.addHandler(new URLHandler())
        this.addHandler(new FolderHandler())
        this.addHandler(new FileHandler())
    }


}
module.exports = {
    GetHttpMethod:GetHttpMethod,
    PostHttpMethod,PostHttpMethod,
    JoinSerializer:JoinSerializer,
    ListJSONSerializer:ListJSONSerializer,
    MergeJSONSerializer:MergeJSONSerializer,
    ListTextAsJSON: ListTextAsJSONSerializer,
    PassThroughDeserializer:PassThroughDeserializer,
    JSONDeserializer:JSONDeserializer,
    FunctionHandler:FunctionHandler,
    URLHandler:URLHandler,
    FolderHandler:FolderHandler,
    FileHandler:FileHandler,
    RestServer:RestServer
}