const PM2 = require('../lib/pm2_ctl/pm2');
const {Processes, Tasks} = require('../lib/db/postgress');
const {logger} = require('../lib/logger');
const { exec } = require('child_process');

//Object to store all currently in progress Tasks, before ack. Object used for the speed.
let currentrunningtask = {};

setInterval(async () => {
    PM2.GetEveryStatus().then(function(data) {
        data.map(function(process) {
            Processes.CreateOrUpdate(process.pm_id, process.name, process.pm2_env.pm_uptime, process.monit.cpu, process.monit.memory, process.pm2_env.OS, process.pm2_env.status);
        });
    });
}, process.env.ProsessUpdateTime);

setInterval(function(){
    logger('info', 'Checking for new tasks');
    Tasks.CheckForNewTasks().then(function(tasks){
        if(tasks.rows.length > 0){
            tasks.rows.forEach(function(task){
                if(currentrunningtask[task.uuid] != "1"){
                    currentrunningtask[task.uuid] = "1";
                    const TaskParser = task.task.toLowerCase().split('_');
                    if(TaskParser[0] == "update"){
                        if(TaskParser[1] == "process"){
                            exec(`git -C ${process.env.APIPath} pull`, (err, stdout, stderr) => {
                                if(err){
                                    logger('error', err);
                                }
                                if(stderr){
                                    logger('error', stderr);
                                }

                                console.log(stdout,);
                            });
                        }else if(TaskParser[1] == "agent"){
                            exec(`git -C ${process.env.AgentPath} pull`, (err, stdout, stderr) => {
                                if(err){
                                    logger('error', err);
                                }
                                if(stderr){
                                    logger('error', stderr);
                                }

                                console.log(stdout,);
                            });
                        }else{
                            logger('error', 'Unknown Path to update');
                        }
                    }
                    /* PM2 Tasks */
                    if(task.task.toLowerCase() == "start"){
                        PM2.Start(task.pm2id).then(function(data){
                            Tasks.ACKTask(task.uuid, "Success").then(function(ack){
                                logger('info', `Task ${task.uuid} acknowledged type: ${task.task}`);
                                delete currentrunningtask[task.uuid];
                            }).catch(function(err){
                                logger('warning', `Task ${task.uuid} failed to acknowledge type: ${task.task}`);
                            });
                        }).catch(function(err){
                            Tasks.ACKTask(task.uuid, err).then(function(ack){
                                logger('info', `Task ${task.uuid} acknowledged type: ${task.task}`);
                                delete currentrunningtask[task.uuid];
                            }).catch(function(err){
                                logger('warning', `Task ${task.uuid} failed to acknowledge type: ${task.task}`);
                            });
                        });
                    }else if(task.task.toLowerCase() == "stop"){
                        PM2.Stop(task.pm2id).then(function(data){
                            Tasks.ACKTask(task.uuid, "Success").then(function(ack){
                                logger('info', `Task ${task.uuid} acknowledged type: ${task.task}`);
                                delete currentrunningtask[task.uuid];
                            }).catch(function(err){
                                logger('error', `Task ${task.uuid} failed to acknowledge type: ${task.task}`);
                            });
                        }).catch(function(err){
                            Tasks.ACKTask(task.uuid, err).then(function(ack){
                                logger('info', `Task ${task.uuid} acknowledged type: ${task.task}`);
                                delete currentrunningtask[task.uuid];
                            }).catch(function(err){
                                logger('warning', `Task ${task.uuid} failed to acknowledge type: ${task.task}`);
                            });
                        });
                    }else if(task.task.toLowerCase() == "restart"){
                        PM2.Restart(task.pm2id).then(function(data){
                            Tasks.ACKTask(task.uuid, "Success").then(function(ack){
                                logger('info', `Task ${task.uuid} acknowledged type: ${task.task}`);
                                delete currentrunningtask[task.uuid];
                            }).catch(function(err){
                                logger('warning', `Task ${task.uuid} failed to acknowledge type: ${task.task}`);
                            });
                        }).catch(function(err){
                            Tasks.ACKTask(task.uuid, err).then(function(ack){
                                logger('info', `Task ${task.uuid} acknowledged type: ${task.task}`);
                                delete currentrunningtask[task.uuid];
                            }).catch(function(err){
                                logger('warning', `Task ${task.uuid} failed to acknowledge type: ${task.task}`);
                            });
                        });
                    }else if(task.task.toLowerCase() == "reload"){
                        PM2.Reload(task.pm2id).then(function(data){
                            Tasks.ACKTask(task.uuid, "Success").then(function(ack){
                                logger('info', `Task ${task.uuid} acknowledged type: ${task.task}`);
                                delete currentrunningtask[task.uuid];
                            }).catch(function(err){
                                logger('warning', `Task ${task.uuid} failed to acknowledge type: ${task.task}`);
                            });
                        }).catch(function(err){
                            Tasks.ACKTask(task.uuid, err).then(function(ack){
                                logger('info', `Task ${task.uuid} acknowledged type: ${task.task}`);
                                delete currentrunningtask[task.uuid];
                            }).catch(function(err){
                                logger('warning', `Task ${task.uuid} failed to acknowledge type: ${task.task}`);
                            });
                        });
                    }else if(task.task.toLowerCase() == "delete"){
                        PM2.Delete(task.pm2id).then(function(data){
                            Tasks.ACKTask(task.uuid, "Success").then(function(ack){
                                logger('info', `Task ${task.uuid} acknowledged type: ${task.task}`);
                                delete currentrunningtask[task.uuid];
                            }).catch(function(err){
                                logger('warning', `Task ${task.uuid} failed to acknowledge type: ${task.task}`);
                            });
                        }).catch(function(err){
                            Tasks.ACKTask(task.uuid, err).then(function(ack){
                                logger('info', `Task ${task.uuid} acknowledged type: ${task.task}`);
                                delete currentrunningtask[task.uuid];
                            }).catch(function(err){
                                logger('warning', `Task ${task.uuid} failed to acknowledge type: ${task.task}`);
                            });
                        });
                    }else{
                        Tasks.ACKTask(task.uuid, "Unknown Task").then(function(ack){
                            logger('warning', `Task ${task.uuid} is unknown type: ${task.task}`);
                            delete currentrunningtask[task.uuid];
                        }).catch(function(err){
                            logger('warning', `Task ${task.uuid} failed to acknowledge type: ${task.task}`);
                        });
                    }
                    
                }
            });
        }
    }).catch(function(err){
        logger('error', `Failed to load tasks: ${err}`);
    });
}, process.env.TaskUpdateTime);
