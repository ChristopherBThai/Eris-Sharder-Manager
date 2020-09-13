const redis = require('./redis.js');

const reqPerInterval = 250;
const interval = 500;

setInterval(async () => {
	const endTime = Date.now() + interval;
	await redis.set("ratelimitTimer",endTime);
	await redis.set("ratelimit",reqPerInterval);
},interval);
