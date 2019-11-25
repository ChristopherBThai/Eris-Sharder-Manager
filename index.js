const express = require('express');
const app = express();
const secret = require('../tokens/wsserver.json');

// Helpers
const levelCooldown = require('./utils/levelCooldown.js');
const lottery = require('./utils/lottery.js');
const vote = require('./utils/vote.js');

app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

const shards = 200;
const sharders = 2;
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
console.log(sharder);

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

const guilds = [];
let guildCount = 0;
const channels = [];
let channelCount = 0;
const users = [];
let userCount = 0;

app.post('/update-bot/:id',function(req,res){
	if(req.body.password!=secret.password) {
		res.sendStatus(400);
		return;
	}

	let id = parseInt(req.params.id);

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
