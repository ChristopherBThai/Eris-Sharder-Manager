const HTTPS = require("https");
const secret = require("../../tokens/owo-auth.json");

exports.getUser = function(id){
	return new Promise((resolve,reject) => {
		HTTPS.request({
			method:"GET",
			host:"discordapp.com",
			path:"/api/v7/users/"+id,
			headers:{
				"User-Agent":"DiscordBot (https://github.com/ChristopherBThai/Eris-Sharder-Manager, 1.0)",
				"Authorization":"Bot "+secret.token
			}
		},(res) => {
			let data = '';
			res.on('data',(d) => {
				data += d;
			});
			res.on('end',() => {
				resolve(JSON.parse(data));
			});
		}).on("error",(err) => {
			reject(err);
		}).end();
	});
}
