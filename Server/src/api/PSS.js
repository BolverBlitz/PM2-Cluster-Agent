require('dotenv').config();
const util = require('util')
const path = require('path');
const Joi = require('joi');
const express = require('express');
const rateLimit = require("express-rate-limit");
const {logger} = require('../../../lib/logger');
const {Processes, Tasks} = require('../../../lib/db/postgress');

let reqPath = path.join(__dirname, '../../../');


const PluginConfig = {
};

/* Plugin info*/
const PluginName = "ClusterDeamon";
const PluginRequirements = [];
const PluginVersion = "0.0.1";
const PluginAuthor = "BolverBlitz";
const PluginDocs = "Private";

const limiter = rateLimit({
	windowMs: 60 * 1000, 
	max: 500
});

const CommandShema = Joi.object({
	Server: Joi.string().required().min(0).max(32).regex(/^[a-z\0-9]*$/i),
	pm2id: Joi.number().required().min(0).max(4294967295),
});

const router = express.Router();

router.get('/', limiter, async (reg, res, next) => {
	try {
		res.sendFile(path.join(`${reqPath}${process.env.PSSConfigPath}/index.html`));
	} catch (error) {
    	next(error);
  	}
});

router.get('/list', limiter, async (reg, res, next) => {
	try {
		Processes.GetAll().then(data => {
			data.rows.forEach(element => {
				element.mem = bytesToSize(element.mem, 2, 1);
				element.cpu = element.cpu.toFixed(2);
				element.uptime = uptimetohuman(element.uptime);
				if(element.state === "online") {
					element.state = "✅";
				} else {
					element.state = "❌";
				}

				element.actions = `<button title="Reload" onclick="ReloadServer('${element.pm2id}', '${element.server}')">💫</button>` + `<button title="Restart" onclick="RestartServer('${element.pm2id}', '${element.server}')">🔄</button>` + `<button title="Stop" onclick="StopServer('${element.pm2id}', '${element.server}')">❌</button>`;
			});

			res.send(data.rows);
		});
	} catch (error) {
    	next(error);
  	}
});

router.post("/restart", limiter, async (reg, res, next) => {
    try {
        const value = await CommandShema.validateAsync(reg.body);
		Tasks.Create(value.Server, "restart", value.pm2id).then(function(task_id){
			Tasks.Await(task_id, 5).then(function(task_done){
				Tasks.Delete(task_id).then(function(task_deleted){
					if(task_deleted.rowCount > 0){
						logger('info', `${PluginName}: ${task_id} was acknowledged with ${task_done.rows[0].status_completed}`);
						res.status(200);
                        res.json({
							status: task_done.rows[0].status_completed,
                        });
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
    } catch (error) {
        next(error);
    }
});

router.post("/reload", limiter, async (reg, res, next) => {
	try {
		const value = await CommandShema.validateAsync(reg.body);
		Tasks.Create(value.Server, "reload", value.pm2id).then(function(task_id){
			Tasks.Await(task_id, 5).then(function(task_done){
				Tasks.Delete(task_id).then(function(task_deleted){
					if(task_deleted.rowCount > 0){
						logger('info', `${PluginName}: ${task_id} was acknowledged with ${task_done.rows[0].status_completed}`);
						res.status(200);
						res.json({
							status: task_done.rows[0].status_completed,
						});
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
    } catch (error) {
        next(error);
    }
});

router.post("/stop", limiter, async (reg, res, next) => {
	try {
		const value = await CommandShema.validateAsync(reg.body);
		Tasks.Create(value.Server, "stop", value.pm2id).then(function(task_id){
			Tasks.Await(task_id, 5).then(function(task_done){
				Tasks.Delete(task_id).then(function(task_deleted){
					if(task_deleted.rowCount > 0){
						logger('info', `${PluginName}: ${task_id} was acknowledged with ${task_done.rows[0].status_completed}`);
						res.status(200);
						res.json({
							status: task_done.rows[0].status_completed,
						});
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
    } catch (error) {
        next(error);
    }
});

function bytesToSize(bytes, precision, si)
{
	var ret;
	si = typeof si !== 'undefined' ? si : 0;
	if(si != 0) {
		var kilobyte = 1000;
		var megabyte = kilobyte * 1000;
		var gigabyte = megabyte * 1000;
		var terabyte = gigabyte * 1000;
	} else {
		var kilobyte = 1024;
		var megabyte = kilobyte * 1024;
		var gigabyte = megabyte * 1024;
		var terabyte = gigabyte * 1024;
	}
	if ((bytes >= 0) && (bytes < kilobyte)) {
		return bytes + ' B';
	} else if ((bytes >= kilobyte) && (bytes < megabyte)) {
		ret = (bytes / kilobyte).toFixed(precision) + ' K';
	} else if ((bytes >= megabyte) && (bytes < gigabyte)) {
		ret = (bytes / megabyte).toFixed(precision) + ' M';
	} else if ((bytes >= gigabyte) && (bytes < terabyte)) {
		ret = (bytes / gigabyte).toFixed(precision) + ' G';
	} else if (bytes >= terabyte) {
		ret = (bytes / terabyte).toFixed(precision) + ' T';
	} else {
		return bytes + ' B';
	}
	if(si != 0) {
		return ret + 'B';
	} else {
		return ret + 'B';
	}
}

function uptimetohuman(uptime) {
	uptime = new Date().getTime() / 1000 - uptime / 1000;
	const date = new Date(uptime*1000);
	const days = date.getUTCDate() - 1,
      hours = date.getUTCHours(),
      minutes = date.getUTCMinutes(),
      seconds = date.getUTCSeconds()


	let segments = [];

	if (days > 0) segments.push(days + ' Tag' + ((days == 1) ? '' : 'e'));
	if (hours > 0) segments.push(hours + ' Stunde' + ((hours == 1) ? '' : 'n'));
	if (minutes > 0) segments.push(minutes + ' Minute' + ((minutes == 1) ? '' : 'n'));
	if (seconds > 0) segments.push(seconds + ' Sekunde' + ((seconds == 1) ? '' : 'n'));

	const dateString = segments.join(', ');
	return dateString;
}

module.exports = {
	router: router,
	PluginName: PluginName,
	PluginRequirements: PluginRequirements,
	PluginVersion: PluginVersion,
	PluginAuthor: PluginAuthor,
	PluginDocs: PluginDocs
  };