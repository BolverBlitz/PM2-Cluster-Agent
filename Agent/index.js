const PM2 = require('../lib/pm2_ctl/pm2');
const {Processes, Tasks} = require('../lib/db/postgress');

//Object to store all currently in progress Tasks, before ack. Object used for the speed.
let currentrunningtask = {};

setInterval(async () => {
    PM2.GetEveryStatus().then(function(data) {
        //console.log(data)
        data.map(function(process) {
            //console.log(process.pm_id, process.name, process.pm2_env.pm_uptime, process.monit.cpu, process.monit.memory, process.pm2_env.OS, process.pm2_env.status);
            Processes.CreateOrUpdate(process.pm_id, process.name, process.pm2_env.pm_uptime, process.monit.cpu, process.monit.memory, process.pm2_env.OS, process.pm2_env.status);
        });
    });
}, process.env.ProsessUpdateTime);

setInterval(function(){
    Tasks.CheckForNewTasks().then(function(tasks){
        if(tasks.rows.length > 0){
            tasks.rows.forEach(function(task){
                if(currentrunningtask[task.uuid] != "1"){
                    currentrunningtask[task.uuid] = "1";
                    if(task.task.toLowerCase() == "start"){
                        PM2.Start(task.pm2id).then(function(data){

                        });
                    }else if(task.task.toLowerCase() == "stop"){
                        PM2.Stop(task.pm2id).then(function(data){

                        });
                    }else if(task.task.toLowerCase() == "restart"){
                        PM2.Restart(task.pm2id).then(function(data){

                        });
                    }else if(task.task.toLowerCase() == "delete"){
                        PM2.Delete(task.pm2id).then(function(data){

                        });
                    }
                    
                }
            });
        }
    }).catch(function(err){
        console.log(err);
    });
}, process.env.TaskUpdateTime);

/*
Tasks.ACKTask(task.uuid).then(function(ack){
    console.log(ack);
}).catch(function(err){
    console.log(err);
});
*/