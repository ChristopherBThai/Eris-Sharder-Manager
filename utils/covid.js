const track = require ('novelcovid');
const cases = {};

exports.data = function () {
	return cases;
}

fetchCases();
setInterval(fetchCases,1800000);

async function fetchCases() {
	let global = await track.all();
	cases.global = global;

	let states = await track.states();
	for (let i in states) {
		try {
			let stateName = states[i].state;
			cases[stateName.replace(/\s/gi,"").toLowerCase()] = states[i];
		} catch (err) {
			console.error("Failed to parse state");
			console.error(states[i]);
		}
	}

	let countries = await track.countries();
	for (let i in countries) {
		try{
			let countryName = countries[i].country;
			cases[countryName.replace(/\s/gi,"").toLowerCase()] = countries[i];
		} catch (err) {
			console.error("Failed to parse country");
			console.error(countries[i]);
		}
	}
}
