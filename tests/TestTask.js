require('dotenv').config();
const { Tasks } = require('../lib/db/postgress');
let currentrunningtask = {};

Tasks.Create(process.env.servername, "restart", 1).then(function(task_id){

    Tasks.Await(task_id, 5).then(function(task_done){
        console.log(`${task_id} was acknowledged and will be deleted\n\nCompleded with state: ${task_done.rows[0].status_completed}`);
        Tasks.Delete(task_id).then(function(task_deleted){
            if(task_deleted.rowCount > 0){
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