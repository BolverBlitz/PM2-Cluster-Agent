const loglevel = Number(process.env.LOG_LEVEL) || 0;
const Levels = ['error', 'warning', 'info'];

console.log(`[${process.env.servername}] \x1b[32m[I]\x1b[0m`, `Logger initialized at level ${Levels[loglevel-1]}`)

/**
 * 
 * @param {string} level 
 * @param {string} text 
 */
const logger = function(level, text) {
    const levelnumber = Levels.indexOf(level.toLowerCase()) + 1

    if(levelnumber <= loglevel && levelnumber == 1) {
        console.log(`[${process.env.servername}] \x1b[31m[E]\x1b[0m`, text)
    }

    if(levelnumber <= loglevel && levelnumber == 2) {
        console.log(`[${process.env.servername}] \x1b[36m[W]\x1b[0m`, text)
    }

    if(levelnumber <= loglevel && levelnumber == 3) {
        console.log(`[${process.env.servername}] \x1b[32m[I]\x1b[0m`, text)
    }
}

module.exports = {
    logger
};