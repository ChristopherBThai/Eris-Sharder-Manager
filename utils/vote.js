/*
 * OwO Bot for Discord
 * Copyright (C) 2019 Christopher Thai
 * This software is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 * For more information, see README.md and LICENSE
  */

/**
 * dbl voting webhooks
 */

const express = require('express');
const app = express();

const dblapi = require('dbl-api');
const api = new dblapi();

app.post('/owo',api.handler);
api.on('upvote', (user,bot,json) => upvote(user,bot,json));

const logger = require('./logger.js');
const mysql = require('./mysql.js');
const redis = require('./redis.js');

/**
 * Listens to upvote webhooks
 */
async function upvote(id,bot,json){
	let weekend = json?json.isWeekend:false;
	let sql = "SELECT count,TIMESTAMPDIFF(HOUR,date,NOW()) AS time FROM vote WHERE id = "+id+";";
	sql += "SELECT IF(patreonDaily = 1 OR ((TIMESTAMPDIFF(MONTH,patreonTimer,NOW())<patreonMonths) AND patreonType = 3),1,0) as patreon FROM user LEFT JOIN patreons ON user.uid = patreons.uid WHERE user.id = "+id+";";
	let result = await mysql.query(sql);

	// Check for patreon
	let patreon = false;
	if(result[1][0]&&result[1][0].patreon==1)
		patreon = true;

	if(result[0][0]==undefined){
		let box = {};
		if(Math.random()<.5){
			box.sql = "INSERT INTO lootbox(id,boxcount,claimcount,claim) VALUES ("+id+",1,0,'2017-01-01') ON DUPLICATE KEY UPDATE boxcount = boxcount + 1;";
			box.text = "\n**<:box:427352600476647425> |** You received a lootbox!"
		}else{
			box.sql = "INSERT INTO crate(uid,cratetype,boxcount,claimcount,claim) VALUES ((SELECT uid FROM user WHERE id = "+id+"),0,1,0,'2017-01-01') ON DUPLICATE KEY UPDATE boxcount = boxcount + 1;";
			box.text = "\n**<:crate:523771259302182922> |** You received a weapon crate!";
		}
		let reward = 100;
		let patreonBonus = 0;
		let weekendBonus = ((weekend)?reward:0);
		if(patreon)
			patreonBonus*=2;
		sql = "INSERT IGNORE INTO vote (id,date,count) VALUES ("+id+",NOW(),1);"+
			"UPDATE IGNORE cowoncy SET money = money+"+(reward+patreonBonus+weekendBonus)+" WHERE id = "+id+";";
		sql += box.sql;
		result = await mysql.query(sql);
		logger.value('cowoncy',(reward+patreonBonus+weekendBonus),['command:vote','id:'+id]);
		let reply = "**☑ |** You have received **"+reward+"** cowoncy for voting!"+patreonMsg(patreonBonus);
		if(weekend)
			reply += "\n**⛱ |** It's the weekend! You also earned a bonus of **"+weekendBonus+"** cowoncy!";
		reply += box.text;
		redis.publish("msgUser",{userID:id,msg:reply,clusterID:0});

	}else if(result[0][0].time>=11){
		let box = {};
		if(Math.random()<.5){
			box.sql = "INSERT INTO lootbox(id,boxcount,claimcount,claim) VALUES ("+id+",1,0,'2017-01-01') ON DUPLICATE KEY UPDATE boxcount = boxcount + 1;";
			box.text = "\n**<:box:427352600476647425> |** You received a lootbox!"
		}else{
			box.sql = "INSERT INTO crate(uid,cratetype,boxcount,claimcount,claim) VALUES ((SELECT uid FROM user WHERE id = "+id+"),0,1,0,'2017-01-01') ON DUPLICATE KEY UPDATE boxcount = boxcount + 1;";
			box.text = "\n**<:crate:523771259302182922> |** You received a weapon crate!";
		}
		let bonus = 100 + (result[0][0].count*3);
		let patreonBonus = 0;
		let weekendBonus = ((weekend)?bonus:0);
		if(patreon)
			patreonBonus= bonus;
		sql = "UPDATE vote SET date = NOW(),count = count+1 WHERE id = "+id+";"+
		"UPDATE IGNORE cowoncy SET money = money+"+(bonus+patreonBonus+weekendBonus)+" WHERE id = "+id+";";
		sql += box.sql;
		result = await mysql.query(sql);
		logger.value('cowoncy',(bonus+patreonBonus,weekendBonus),['command:vote','id:'+id]);
		let reply = "**☑ |** You have received **"+bonus+"** cowoncy for voting!"+patreonMsg(patreonBonus);
		if(weekend)
			reply += "\n**⛱ |** It's the weekend! You also earned a bonus of **"+weekendBonus+"** cowoncy!";
		reply += box.text;
		redis.publish("msgUser",{userID:id,msg:reply,clusterID:0});

	}else{
		let reply = "You need to wait "+(12-result[0][0].time)+" hours before voting again!";
		redis.publish("msgUser",{userID:id,msg:reply,clusterID:0});
	}
	console.log(id+" has voted!");
	logger.increment("votecount");
}

app.listen(3001,() => {
	console.log("\x1b[33m","Voting is listening on port 3001!");
});

function patreonMsg(amount){
	if(!amount||amount==0)
		return "";
	return "\n**<:blank:427371936482328596> |** And **"+amount+"** cowoncy for being a <:patreon:449705754522419222> Patreon!";
}

