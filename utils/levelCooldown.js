const redis = require('./redis.js');

async function resetCooldown(){
	try{
		let result = await redis.del("user_xp_cooldown");
		if(!result)
			console.error("["+(new Date()).toLocaleString()+"] Something might be wrong with xp cooldowns... Please double check.");
	}catch(err){
		console.error("Failed to reset xp cooldown");
	}
}

setInterval(resetCooldown,60000);
