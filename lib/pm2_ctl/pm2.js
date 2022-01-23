const pm2 = require('pm2')

/**
 * This function will resolve the PM2_IDs of the names
 * @param {Array} NameList
 * @returns Array
 */
let GetPM2IDByName = function (NameList) {
    return new Promise(function (resolve, reject) {
        pm2.connect(function (err) {
            if (err) {
                console.error(err)
                process.exit(2)
            }

            pm2.list((err, list) => {
                pm2.disconnect()
                if (err) {
                    reject(err);
                }
                let Filterd = list.filter(function (el) { return NameList.includes(el.name) });
                let FilterdIDs = [];
                Filterd.map(Data => {
                    FilterdIDs.push(Data.pm_id)
                })
                resolve(FilterdIDs)
            })
        })
    });
}

/**
 * This function will resolve with all informations about a prosess  
 * Works with IDs & Names  
 * @param {String | Number} proc
 * @returns Object
 */
let GetStatus = function (proc) {
    return new Promise(function (resolve, reject) {
        pm2.connect(function (err) {
            if (err) {
                console.error(err)
                process.exit(2)
            }

            pm2.describe(proc, (err, process_data) => {
                pm2.disconnect()
                if (err) {
                    reject(err);
                }
                resolve(process_data)
            })
        })
    });
}

/**
 * This function will resolve with all informations about all prosesses in that list  
 * Works with IDs & Names  
 * @param {Array} proclist
 * @returns Object
 */
let GetEveryStatusFromList = function (proclist) {
    return new Promise(function (resolve, reject) {
        pm2.connect(function (err) {
            if (err) {
                console.error(err)
                process.exit(2)
            }

            pm2.list((err, list) => {
                pm2.disconnect()
                if (err) {
                    reject(err);
                }
                let Filterd = list.filter(function (el) { return proclist.includes(el.name) });
                resolve(Filterd)
            })
        })
    });
}

/**
 * This function will resolve with all informations about all prosesses 
 * Works with IDs & Names  
 * @returns Object
 */
let GetEveryStatus = function () {
    return new Promise(function (resolve, reject) {
        pm2.connect(function (err) {
            if (err) {
                console.error(err)
                process.exit(2)
            }

            pm2.list((err, list) => {
                pm2.disconnect()
                if (err) {
                    reject(err);
                }
                resolve(list)
            })
        })
    });
}

/**
 * THis returns the prosess of itself if it runs in PM2
 * @returns Object
 */
let GetMe = function () {
    return new Promise(function (resolve, reject) {
        pm2.connect(function (err) {
            if (err) {
                console.error(err)
                process.exit(2)
            }

            pm2.list((err, list) => {
                pm2.disconnect()
                if (err) {
                    reject(err);
                }

                //console.log(list[0].pid, process.pid);
                let Filterd = list.filter(function (el) { return el.pid == process.pid });
                if (Filterd.length > 0) {
                    resolve(Filterd[0].pm_id);
                } else {
                    reject(`Not running as PM2 Process. PID is: ${process.pid}`);
                }
            })
        })
    });
}

/**
 * Starts a process, based on js config files
 * @param {String} config  
 * @returns Object
 */
let Start = function (proc) {
    return new Promise(function (resolve, reject) {
        pm2.connect(function (err) {
            if (err) {
                console.error(err)
                process.exit(2)
            }

            pm2.start(proc, (err, process_data) => {
                pm2.disconnect()
                if (err) {
                    reject(err);
                }
                resolve(process_data)
            });
        });
    });
}

/**
 * Stop a process
 * @param {String} proc  
 * @returns Object
 */
let Stop = function (proc) {
    return new Promise(function (resolve, reject) {
        pm2.connect(function (err) {
            if (err) {
                console.error(err)
                process.exit(2)
            }

            pm2.stop(proc, (err, process_data) => {
                pm2.disconnect()
                if (err) {
                    reject(err);
                }
                resolve(process_data)
            });
        });
    });
}

/**
 * ReStarts a process
 * @param {String} proc  
 * @returns Object
 */
let Restart = function (proc) {
    return new Promise(function (resolve, reject) {
        pm2.connect(function (err) {
            if (err) {
                console.error(err)
                process.exit(2)
            }

            pm2.restart(proc, (err, process_data) => {
                pm2.disconnect()
                if (err) {
                    reject(err);
                }
                resolve(process_data)
            });
        });
    });
}

/**
 * Reload a process
 * @param {String} proc  
 * @returns Object
 */
let Reload = function (proc) {
    return new Promise(function (resolve, reject) {
        pm2.connect(function (err) {
            if (err) {
                console.error(err)
                process.exit(2)
            }

            pm2.reload(proc, (err, process_data) => {
                pm2.disconnect()
                if (err) {
                    reject(err);
                }

                resolve(process_data)
            });
        });
    });
}

/**
 * Delete a process
 * @param {String} proc  
 * @returns Object
 */
let Delete = function (proc) {
    return new Promise(function (resolve, reject) {
        pm2.connect(function (err) {
            if (err) {
                console.error(err)
                process.exit(2)
            }

            pm2.delete(proc, (err, process_data) => {
                pm2.disconnect()
                if (err) {
                    reject(err);
                }
                resolve(process_data)
            });
        });
    });
}

module.exports = {
    GetPM2IDByName,
    GetStatus,
    GetEveryStatus,
    GetEveryStatusFromList,
    GetMe,
    Start,
    Stop,
    Restart,
    Reload,
    Delete
};