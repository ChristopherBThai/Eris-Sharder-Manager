const mysql = require('./mysql.js');
const requestHandler = require('./requestHandler.js');
const redis = require('./redis.js');
const logger = require('./logger.js');

async function pickWinner(){
	// Resets dily weapons
	redis.publish("resetDailyWeapons",{shardID:0});
	console.log("Picking lottery winner...");
	let sql = "SELECT id,amount,channel FROM lottery WHERE valid = 1;"+
		"SELECT SUM(amount) AS sum,COUNT(id) AS count FROM lottery WHERE valid = 1;";
	let result = await mysql.query(sql);
	let sum = parseInt(result[1][0].sum);
	let prize = sum + 500;
	let users = result[0];
	let rand = Math.floor(Math.random()*sum);
	let count = 0;
	let found = false;
	let winner;
	let winnerchance;
	let winnerChannel;
	let loser = [];
	let loserchance = [];
	for (i in users){
		let id = users[i].id;
		count += users[i].amount;
		let chance = (users[i].amount/sum)*100;
		if(chance>=.01)
			chance = Math.trunc(chance*100)/100;
		if(rand<count&&!found){ //Winner
			found = true;
			let winnerChannel = users[i].channel;
			winner = id;
			winnerchance = chance

			sql = "INSERT INTO cowoncy (id,money) VALUES ("+id+","+prize+") ON DUPLICATE KEY UPDATE money = money + "+prize+";";
			sql += "UPDATE lottery SET valid = 0,amount = 0 WHERE valid = 1";
			result = await mysql.query(sql);
			logger.value('cowoncy',prize,['command:lottery','id:'+id]);
		} else {
			loser.push(id);
			loserchance.push(chance);
		}
	}

	let winnername = await requestHandler.getUser(winner);
	if(winnername.username) {
		winnername.logname = winnername.username+'#'+winnername.discriminator;
	} else {
		winnername.username = undefined;
		winnername.logname = undefined;
	}
	msgUsers(winnername,winner,winnerchance,winnerChannel,prize,loser,loserchance,-1);
	setTime();
}

function msgUsers(winnername,winner,chance,winnerChannel,prize,loser,loserchance,i){
	if(i>=loser.length)
		return;
	if(i<0){
		let msg = "Congrats! You won **"+prize+" cowoncy** from the lottery with a **"+chance+"%** chance to win!";
		redis.publish("msgUser",{userID:winner,msg,shardID:0});
		msg = "Congrats <@"+winner+">! You won **"+prize+"** cowoncy from the lottery with a **"+chance+"%** chance to win!";
		redis.publish("msgChannel",{channelID:winnerChannel,msg});
		console.log("\x1b[36m%s\x1b[0m","    "+winnername.logname+" won the lottery");
	}else{
		let text = "You lost the lottery...\nYou had a **"+loserchance[i]+"%** chance to win **"+prize+" cowoncy...**";
		if(winnername!=undefined)
			text += "\nThe winner was **"+winnername.username+"** with a **"+chance+"%** chance to win!";
		redis.publish("msgUser",{userID:loser[i],msg:text,shardID:0});
		console.log("\x1b[36m%s\x1b[0m","    msg sent to "+loser[i]+" for losing");
	}
	setTimeout(function(){msgUsers(winnername,winner,chance,winnerChannel,prize,loser,loserchance,i+1)},15000);
}

function setTime(){
	let now = new Date();
	let mill = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 24, 0, 0, 0) - now;
	if (mill < 0) {
		     mill += 86400000;
	}
	let timer = setTimeout(pickWinner,mill);
}

setTime();
