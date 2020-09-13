const redis = require('redis');
const login = require('../../tokens/owo-login.json');
const client = redis.createClient({
  host: login.redis_host,
  password: login.redis_pass
});

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

exports.set = function(key,val){
	return new Promise(function(res,rej){
		client.set(key,val,function(err,val){
			if(err) rej(err);
			else res(val);
		});
	});
}

exports.hgetall = function(key){
	return new Promise(function(res,rej){
		client.hgetall(key,function(err,val){
			if(err) rej(err);
			else res(val);
		});
	});
}

exports.hmset = function(key,val){
	return new Promise(function(res,rej){
		client.hmset(key,val,function(err,val){
			if(err) rej(err);
			else res(val);
		});
	});
}
