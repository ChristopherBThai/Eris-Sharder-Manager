const redis = require('redis');
const client = redis.createClient();

client.on('connect',function(){
	console.log('Redis connected');
});

client.on('error',function(err){
	console.error("Redis error on "+(new Date()).toLocaleString());
	console.error(err);
});

exports.del = function(table){
	return new Promise(function(res,rej){
		client.del(table,function(err,reply){
			if(err)
				rej(err);
			else
				res(reply);
		});
	});
}

exports.publish = async function(channel,message=true){
	if(typeof message == "object")
		message = JSON.stringify(message);
	return await client.publish(channel,message);
}
