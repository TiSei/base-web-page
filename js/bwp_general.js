function sum(arr) { return arr.reduce((a, b) => a + b); }
function sumSecure(arr) { return arr.reduce((a, b) => (isNaN(a) ? a : 0) + (isNaN(b) ? b : 0)); }
function toRadian(degree) { return degree * (Math.PI / 180); }
function toDegree(radians) { return radians * (180 / Math.PI); }
function round(num, spaces = 0) { return Math.round(num*Math.pow(10,spaces))/Math.pow(10,spaces); }
function ceilUp(num) { return Math.ceil(num) }
function ceilDown(num) { return Math.floor(num); }

function createElement(type,classes,attributes = {},innerHTML = undefined) {
	let elem = null;
	if (type.constructor == Array)
		elem = document.createElementNS(type[0], type[1]);
	else
		elem = document.createElement(type);
	elem.classList.add(...classes);
	for (let attr_key of Object.keys(attributes)) {
		elem.setAttribute(attr_key,attributes[attr_key]);
	}
	if (innerHTML !== undefined)
		elem.innerHTML = innerHTML;
	return elem;
}

function displayConfirmAlert(msg) {
	return confirm(msg);
}

async function universalFetchAsync({url, responseType = 'text', onSuccess = () => {}, onError = () => {}}) {
	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error('HTTP error ' + response.status);
		const data = responseType === 'json' ? await response.json() : await response.text();
		onSuccess(data);
	} catch (err) {
		onError(err);
	}
}
