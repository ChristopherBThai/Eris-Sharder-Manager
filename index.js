const express = require('express');
const app = express();
const secret = require('../tokens/wsserver.json');

// Helpers
const levelCooldown = require('./utils/levelCooldown.js');
const lottery = require('./utils/lottery.js');
const vote = require('./utils/vote.js');
const ratelimiter = require('./utils/globalRatelimitBucket.js');
const redis = require('./utils/redis.js');
const covid = require('./utils/covid.js');

app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

const shards = 400;
const sharders = 2;
/*
const sharder = [];

var minShards = Math.floor(shards/sharders);
var shardDiff = shards-(minShards*sharders);
var current = 0;
for(let i = 0;i<sharders;i++){
	let lastShardID = current+minShards-1;
	if(shardDiff>0){
		lastShardID++;
		shardDiff--;
	}
	sharder.push({
		shards,
		firstShardID:current,
		lastShardID,
		shardCount:((lastShardID-current)+1)
	});
	current = lastShardID+1;
}
*/
// for now, lets override
const sharder = [
	{ shards: 400, firstShardID: 0, lastShardID: 299, shardCount: 300 },
  { shards: 400, firstShardID: 300, lastShardID: 399, shardCount: 100 }
]

app.get('/sharder-info/:id',function(req,res){
	console.log("Shard Info request from shard manager #"+req.params.id);
	let id = parseInt(req.params.id);
	if(!sharder[id])
		res.send(400);
	else
		res.send(sharder[id]);
});

const shardInfo = [];

app.post('/update-shard',function(req,res){
	if(req.body.password!=secret.password) {
		res.sendStatus(400);
		return;
	}
	for(let i in req.body){
		let id = parseInt(i);
		shardInfo[id] = req.body[i];
	}
	res.sendStatus(200);
});

app.get('/shard-status',function(req,res){
	res.send(shardInfo);
});

const guilds = {};
let guildCount = 0;
const channels = {};
let channelCount = 0;
const users = {};
let userCount = 0;

app.post('/update-bot/:id',function(req,res){
	if(req.body.password!=secret.password) {
		res.sendStatus(400);
		return;
	}

	let id = req.params.id;

	let gc = parseInt(req.body.guilds);
	guildCount += gc - (guilds[id]?guilds[id]:0);
	guilds[id] = gc;

	let cc = parseInt(req.body.channels);
	channelCount += cc - (channels[id]?channels[id]:0);
	channels[id] = cc;

	let uc = parseInt(req.body.users);
	userCount += uc - (users[id]?users[id]:0);
	users[id] = uc;

	res.send({guilds:guildCount,channels:channelCount,users:userCount});
});

app.get('/botinfo',function(req,res){
	res.send({guilds:guildCount,channels:channelCount,users:userCount});
});

app.get('/totalShards',function(req,res){
	res.send({totalShards:shards,sharders});
});

const imagegenAuth = require('../tokens/imagegen.json');
const modChannel = "471579186059018241";
app.post('/verified/:id', async function(req, res) {
	try {
		if(req.body.password!=imagegenAuth.password) {
			res.sendStatus(401);
			return;
		}

		let id = req.params.id;
		let username = req.body.username;
		let user = await redis.hgetall(id);

		// No verification needed
		if (!user||!user.captchaUrl||user.captchaUrl=="ok") {
			res.sendStatus(406);
			console.log("not banned");
			return;
		}

		// Over 10 minutes
		if ((new Date())-new Date(user.validTime)>600000) {
			res.sendStatus(406);
			return;
		}

		const msgCount = user.validMsgCount;

		// Success
		user.validTryCount = 0;
		user.validMsgCount = 0;
		user.validText = "ok";
		user.validReason = "none";
		user.captchaUrl = "ok";
		await redis.hmset(id,user);

		res.sendStatus(200);

		let text = "**👍 |** I have verified that you are human! Thank you! :3"
		await redis.publish("msgUser",{userID:id,msg:text,shardID:0});
		text = "**⚠ | ["+user.validCount+"] ["+msgCount+"/5] "+username+"** avoided ban with google recaptcha\n**<:blank:427371936482328596> | ID:** "+id;
		text += "\n**<:blank:427371936482328596> | Server:** ["+user.guildId+"] "+user.guildName;
		text += "\n**<:blank:427371936482328596> | Channel:** ["+user.channelId+"] "+user.channelName;
		if (user.validTime)
			text += "\n**<:blank:427371936482328596> | Sent On:** " + user.validTime.toLocaleString();
		await redis.publish("msgChannel",{channelID:modChannel,msg:text});

	} catch (err) {
		console.error(err);
		res.sendStatus(400);
	}
});

app.get('/covid', function(req, res) {
	res.send(covid.data());
});

app.listen(secret.port, () => {
	console.log("\x1b[33m","Sharding manager is listening on port "+secret.port+"!");
});
