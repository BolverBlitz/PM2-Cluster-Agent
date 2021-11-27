require('dotenv').config()

let Arguments = process.argv[2].toLocaleLowerCase()

if(Arguments === '-h' || Arguments === '--help'){
    console.log(`
    Usage: node index.js [arguments]
    Arguments:
    -a | --agent to run as agent
    -s | --server to run as server
    `)
}else if(Arguments === '-a' || Arguments === '--agent'){
    require('./agent')
}else if(Arguments === '-s' || Arguments === '--server'){
    require('./server')
}else{
    console.log(`
    Usage: node index.js [arguments]
    Arguments:
    -a | --agent to run as agent
    -s | --server to run as server
    `)
}