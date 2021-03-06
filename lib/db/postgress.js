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
    name: Name of the process
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
    name text,
    uptime bigint,
    cpu float,
    mem bigint,
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
    status_completed text,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)`, (err, result) => {
    if (err) {console.log(err)}
});

/**
 * This function will create or update a process in the database
 * If the process name includes agent it will be marked as agent
 * @returns {Promise}
 */
const CreateOrUpdateProsessList = function(pm2id, Pname, uptime, cpu, mem, os, state) {
  return new Promise(function(resolve, reject) {
      let type = "";
      let updated_at = new Date();
      if(Pname.toLowerCase().includes("agent")) {
          type = "agent";
      } else {
          type = "process";
      }
      pool.query(`INSERT INTO processes (server, type, pm2id, name, uptime, cpu, mem, os, state, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (server, pm2id) DO UPDATE SET type = $2, name = $4, uptime = $5 , cpu = $6, mem = $7, os = $8, state = $9, updated_at = $10`, [
          process.env.servername, type, pm2id, Pname, uptime, cpu, mem, os, state, updated_at
          ], (err, result) => {
              if (err) {reject(err)}
              resolve(result);
          });
  });
}

/**
 * This function will return all processes
 * @returns {Promise}
 */
 const GetAllProcesses = function() {
  return new Promise(function(resolve, reject) {
    pool.query(`SELECT * FROM public.processes WHERE updated_at > now()::timestamp - interval '24h' ORDER BY server ASC, pm2id ASC`, (err, result) => {
      if (err) {reject(err)}
        resolve(result);
    });
  });
}

/**
 * This function delete a process from the database
 * @param {string} server - The server name
 * @param {number} pm2id - The pm2 id of the process
 * @returns {Promise}
 */
 const DeleteAProcess = function(server, pm2id) {
  return new Promise(function(resolve, reject) {
    pool.query(`DELETE from processes WHERE server=$1 AND pm2id=$2`,[
      server, pm2id
    ], (err, result) => {
      if (err) {reject(err)}
        resolve(result);
    });
  });
}

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
        pool.query(`INSERT INTO tasks (uuid, to_server, from_server, task, pm2id) VALUES ($1,$2,$3,$4,$5)`, [
            uuid, to_server, process.env.servername, task, pm2id
            ], (err, result) => {
                if (err) {reject(err)}
                resolve(uuid);
            });
    });
}

/**
 * This function will get all messages to prosses
 * @returns {Promise}
 */
const CheckForNewTasks = function() {
    return new Promise(function(resolve, reject) {
      pool.query(`SELECT * FROM tasks WHERE to_server = $1 AND completed = false`, [
        process.env.servername
        ], (err, result) => {
        if (err) {reject(err)}
          resolve(result);
      });
    });
}

/**
 * This function will get a completed task only
 * @param {number} uuid - The uuid of the task
 * @returns {Promise}
 */
const CheckIfTaskCompleted = function(uuid) {
    return new Promise(function(resolve, reject) {
      pool.query(`SELECT * FROM tasks WHERE completed = true AND uuid = $1`, [
        uuid
        ], (err, result) => {
        if (err) {reject(err)}
          if(result.rows.length > 0) {
            resolve(result);
          } else {
            reject(false);
          }
      });
    });
}

/**
 * This function will mark a Task as run
 * @param {String} uuid - The uuid of the task
 * @param {String} status - The status of the task
 * @returns {Promise}
 */
const ACKTask = function(uuid, status) {
    return new Promise(function(resolve, reject) {
      pool.query(`UPDATE tasks SET completed = true, status_completed = $2 WHERE uuid = $1`, [
        uuid, status
        ], (err, result) => {
        if (err) {reject(err)}
          resolve(result);
      });
    });
}

/**
 * This function is used to delete a task
 * @param {number} uuid - The uuid of the task
 * @returns {Promise}
 */
 const DelTask = function(uuid) {
    return new Promise(function(resolve, reject) {
      pool.query(`DELETE FROM tasks WHERE uuid = '${uuid}'`, (err, result) => {
        if (err) {reject(err)}
          resolve(result);
      });
    });
}

/**
 * Will wait for a task to complete or until the runs are over
 * @param {number} uuid 
 * @param {number} tries 
 * @returns 
 */
const awaitTask = function(uuid, tries) {
    return new Promise(function cb(resolve, reject) {
      if (--tries > 0) {
        CheckIfTaskCompleted(uuid).then(function(result) {
            resolve(result);
        }).catch(function(err) {
            if(err === false){
                setTimeout(function() {
                    cb(resolve, reject);
                }, 500);
            } else {
                reject("DB Error");
            }
        });
      } else {
        reject("Timeout");
      }
    });
  }

const Processes = {
  CreateOrUpdate: CreateOrUpdateProsessList,
  GetAll: GetAllProcesses,
  Delete: DeleteAProcess
}

const Tasks = {
    CheckForNewTasks: CheckForNewTasks,
    Create: CreateNewTask,
    ACKTask: ACKTask,
    Delete: DelTask,
    Await: awaitTask
}

module.exports = {
    Tasks,
    Processes
};
