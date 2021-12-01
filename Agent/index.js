const PM2 = require('./lib/pm2_ctl/pm2');

PM2.GetMe().then(function(me) {
    console.log(me);
});
