const pg = require('pg');
const randomstring = require("randomstring");

const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})

/* Create Table for process stats

    server: Stores the server name
    type: Stores the type of process (Agent or API)
    pm2id: Pm2 ID of the process
    uptime: Timestamp von der uptime
    cpu: Process CPU usage
    mem: Process memory usage
    os: OS information
    queryspersec: Queries per second served by the process
    state: Online / Offline
    updated_at: Timestamp of the last update
*/

pool.query(`CREATE TABLE IF NOT EXISTS processes (
    server text,
    type text,
    pm2id int,
    uptime bigint,
    cpu float,
    mem int,
    os text,
    queryspersec int,
    state text,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (server, pm2id))`, (err, result) => {
    if (err) {console.log(err)}
});

/* Create Table for process stats */
pool.query(`CREATE TABLE IF NOT EXISTS tasks (
    uuid text PRIMARY KEY,
    to_server text,
    from_server text,
    pm2id int,
    completed boolean DEFAULT false,
    task text,
    status_complete text,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)`, (err, result) => {
    if (err) {console.log(err)}
});

/**
 * This function will create a new Task
 * @param {string} to_server - The server that should run the Task
 * @param {string} task - The task that should be executed
 * @param {Number} pm2id - The pm2 id of the process to run the task on
 * @returns {Promise}
 */
 const CreateNewTask = function(to_server, task, pm2id) {
    return new Promise(function(resolve, reject) {

        const uuid = randomstring.generate({
            length: 10,
            charset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!'
        });

        pool.query(`INSERT INTO innersync (uuid ,to_server, from_server, task, pm2id) VALUES ($1,$2,$3,$4,$5)`, [
            uuid, to_server, process.env.servername, task, pm2id
            ], (err, result) => {
                if (err) {reject(err)}
                resolve(result);
            });
    }   );
}

/**
 * This function will get all messages to prosses
 * @param {string} server - The local server name
 * @returns {Promise}
 */
const CheckForNewTasks = function(server) {
    return new Promise(function(resolve, reject) {
      pool.query(`SELECT * FROM tasks WHERE to_server = $1`, [
        server
        ], (err, result) => {
        if (err) {reject(err)}
          resolve(result);
      });
    });
}

const Tasks = {
    CheckForNewTasks: CheckForNewTasks,
    CreateNewTask: CreateNewTask
}
  

module.exports = {
    Tasks
};
