require('dotenv').config();
const { Tasks } = require('../lib/db/postgress');
let currentrunningtask = {};

console.log("1: Will create 'Test Task'");
setTimeout(function(){
    Tasks.Create(process.env.servername, "Test Task", 0).then(function(task){
        console.log("2: Task created: " + task);

        Tasks.Await(task, 5).then(function(task_done){
            console.log(`5: ${task_done.rows[0].uuid} was completed in ${new Date().getTime() - new Date(task_done.rows[0].time).getTime()} ms`);
            Tasks.Delete(task).then(function(task_deleted){
                if(task_deleted.rowCount > 0){
                    console.log(`6: ${task_done.rows[0].uuid} was deleted`);
                    process.exit(1)
                }
            }).catch(function(err){
                console.log(err);
            });
        }).catch(function(err){
            console.log(err);
        });

    }).catch(function(err){
        console.log(err);
    });
}, 2500);

setInterval(function(){
    Tasks.CheckForNewTasks().then(function(tasks){
        if(tasks.rows.length > 0){
            tasks.rows.forEach(function(task){
                if(currentrunningtask[task.uuid] != "1"){
                    currentrunningtask[task.uuid] = "1";
                    console.log(`3: Running: ${task.task}(${task.uuid})`);
                    setTimeout(function(){
                        Tasks.ACKTask(task.uuid).then(function(ack){
                            console.log(`4: Task ${task.uuid} acknowledged`);
                            delete currentrunningtask[task.uuid];
                        }).catch(function(err){
                            console.log(err);
                        });
                    }, 100);
                }
            });
        }
    }).catch(function(err){
        console.log(err);
    });
}, 100);