const {spawn} = require('child_process');
const fs = require('fs');
const path = require('path');

const showStdout = process.argv.length >= 3 ? process.argv.includes('debug') : false;

(async ()=>{
    let error = false
    //run every .js file in the tests folder
    let testFiles = fs.readdirSync('tests')
    for await ( let testFile of testFiles ){
        if ( path.extname(testFile) != '.js'){
            continue
        }
        let testPath = path.resolve('tests',testFile)
        const child = spawn('node',[testPath])

        if ( showStdout ){
            console.log()
            console.log(`Running test "\x1b[35m${testFile}\x1b[0m"`)
            for await(const stdout of child.stdout){
                process.stdout.write(`\x1b[36m${testFile}:\x1b[0m ${stdout.toString()}`)
            }            
        }

        for await(const stderr of child.stderr){
            if ( !error ){
                console.error("\x1b[31m❌ One or more test(s) failed.\x1b[0m")
            }
            error = true
            process.stderr.write(`\x1b[36m${testFile}:\x1b[0m ${stderr.toString()}`)
        }
    }

    if (!error){        
        console.log("\x1b[32m✅ All tests passed.\x1b[0m")
        process.exit(0)
    }
    process.exit(1)

})()
