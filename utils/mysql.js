const mysql = require('mysql');
const login = require('../../tokens/owo-login.json');
config = {
	host: "localhost",
	user: login.user,
	password: login.pass,
	database: "owo",
	supportBigNumbers: true,
	bigNumberStrings: true,
	multipleStatements: true,
	charset: "utf8mb4"
};
const pool = mysql.createPool(config);

exports.query = function(sql,variables = []) {
	return new Promise( (resolve, reject) => {
		let query = this.con.query(sql,variables,function(err,rows){
			if(err) return reject(err);
			resolve(rows);
		});
	});
}

exports.con = pool;
exports.mysql = mysql;
