require('dotenv').config();
const { Tasks } = require('../lib/db/postgress');
let currentrunningtask = {};
let currenttests = {};
let Tests = [];

const AwaitTryes = 7;
const TestAmount = 30;
const TestDelayIncrement = 100;

for(let i = 0; i < TestAmount; i++){
    Tests.push(Tests.push(createTask(`TestTask-${i}`, TestDelayIncrement*(1+i))));
}

console.log(`
    1: Start Test
    2: Create Task
    3: Running Task
    4: ACK Task
    5: Await Task
    6: Delete Task
`)

Promise.all(Tests).then(function(results){
    for (const [index, [key, value]] of Object.entries(Object.entries(currenttests))) {
        let test = value.Tests.join("")
        if(test == "123456"){
            console.log("Test " + key + " completed in " + value.CompletedAfter + "ms" + " with a delay of " + value.Timetocomplete + "ms");
        }else{
            if(results[index*2] === "Timeout"){
                console.log("Test " + key + " timed out");
            }else{
                console.log("Test " + key + " failed with " + "Steps: " + test);
            }
        }
    }
    setTimeout(function(){
        process.exit(0);
    }, 2500);
}).catch(function(err){
    console.log("Error: " + err);
    process.exit(1);
});

function createTask(TestTaskID, timetocomplete){
    return new Promise(function(resolve, reject) {
        currenttests[TestTaskID] = {
            Tests: [],
            Timetocomplete: timetocomplete,
            CompletedAfter: 0
        }
        currenttests[TestTaskID].Tests.push("1")
        setTimeout(function(){
            Tasks.Create(process.env.servername, TestTaskID, timetocomplete).then(function(task){
                currenttests[TestTaskID].Tests.push("2")
                Tasks.Await(task, AwaitTryes).then(function(task_done){
                    currenttests[TestTaskID].Tests.push("5")
                    currenttests[TestTaskID].CompletedAfter = new Date().getTime() - new Date(task_done.rows[0].time).getTime()
                    Tasks.Delete(task).then(function(task_deleted){
                        if(task_deleted.rowCount > 0){
                            currenttests[TestTaskID].Tests.push("6")
                            resolve(TestTaskID)
                        }
                    }).catch(function(err){
                        console.log(err);
                    });
                }).catch(function(err){
                    resolve(err)
                });
        
            }).catch(function(err){
                console.log(err);
            });
        }, 500);
    });
}


setInterval(function(){
    Tasks.CheckForNewTasks().then(function(tasks){
        if(tasks.rows.length > 0){
            tasks.rows.forEach(function(task){
                if(currentrunningtask[task.uuid] != "1"){
                    currentrunningtask[task.uuid] = "1";
                    currenttests[task.task].Tests.push("3")
                    setTimeout(function(){
                        Tasks.ACKTask(task.uuid).then(function(ack){
                            currenttests[task.task].Tests.push("4")
                            setTimeout(function(){
                                delete currentrunningtask[task.uuid];
                            }, task.pm2id*2);
                        }).catch(function(err){
                            console.log(err);
                        });
                    }, task.pm2id);
                }
            });
        }
    }).catch(function(err){
        console.log(err);
    });
}, 100);