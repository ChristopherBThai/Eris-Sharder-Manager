const mysql = require('./mysql.js');
const redis = require('./redis.js');

exports.checkPerks = async function (body) {
	const id = body.user;

	if (typeof body.animal == "boolean") {
		if (body.animal) {
			await gainedAnimal(id);
		} else {
			await lostAnimal(id);
		}
	}

	if (typeof body.daily == "boolean") {
		if (body.daily) {
			await gainedDaily(id);
		} else {
			await lostDaily(id);
		}
	}
}

async function gainedDaily (id) {
	let sql = `INSERT INTO user (id,count,patreonDaily) VALUES (${id},0,1) ON DUPLICATE KEY UPDATE patreonDaily = 1;`;
	await mysql.query(sql);

	let text = "You have gained access to **Bonus Dailies**! You will get extra cowoncy when voting and claiming dailies!"
	await msgUser(id, text);
}

async function lostDaily (id) {
	let sql = `UPDATE IGNORE user SET patreonDaily = 0 WHERE id = ${id};`;
	await mysql.query(sql);
}

async function gainedAnimal (id) {
	let sql = `INSERT INTO user (id,count,patreonAnimal) VALUES (${id},0,1) ON DUPLICATE KEY UPDATE patreonAnimal = 1;`;
	await mysql.query(sql);

	let text = "Thank you for joining OwO Bot's Patreon! You now have access to all **Patreon animals**! Have fun!"
	await msgUser(id, text);
}

async function lostAnimal (id) {
	let sql = `UPDATE IGNORE user SET patreonAnimal = 0 WHERE id = ${id};`;
	await mysql.query(sql);

	let text = "Thank you for supporting the bot! You've lost the perk to catch **Patreon Animals**."
	text += "\n\nIf this is a mistake, please check the following:";
	text += "\n - You are still in the OwO Bot Support Server";
	text += "\n - Your Patreon account is still linked with your Discord account";
	text += "\n - Your Patreon payment went through recently. If your payment has failed, please wait a few days for Patreon to try charging you again";
	await msgUser(id, text);
}

async function msgUser (id, msg) {
	await redis.publish("msgUser",{ userID:id, msg, shardID:0 });
}
