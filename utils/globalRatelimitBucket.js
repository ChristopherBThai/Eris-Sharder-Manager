const redis = require('./redis.js');

const reqPerFiveSec = 150;
const fiveSec = 5000;

setInterval(async () => {
	const endTime = Date.now() + fiveSec;
	await redis.set("ratelimitTimer",endTime);
	await redis.set("ratelimit",reqPerFiveSec);
},fiveSec);
