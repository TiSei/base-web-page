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

async function universalFetchAsync({url, responseType = 'text', onSuccess = () => {}, onError = () => {}, ignoreNotModified = false, noCache = false}) {
	try {
		const response = await fetch(url, {cache: (noCache ? 'no-store' : 'default')});
		if (!response.ok) throw new Error('HTTP error ' + response.status);
		if (response.status !== 304 || ignoreNotModified) {
			const data = responseType === 'json' ? await response.json() : await response.text();
			onSuccess(data);
		}
	} catch (err) {
		onError(err);
	}
}

const BwpWidgetRegistry = {
	widgetMap: {},

	register(selector, Widget, forceInit = true) {
		this.widgetMap[selector] = Widget;
		if (forceInit)
			this.initWidgets(document);
	},

	initWidgets(root = document) {
		for (const [selector, Widget] of Object.entries(this.widgetMap)) {
			root.querySelectorAll(selector).forEach(el => {
				if (!el._bwpInstance)
					el._bwpInstance = new Widget(el);;
			});
		}
	},

	watchDOM() {
		if (this._observer) return;
		this._observer = new MutationObserver(mutations => {
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					if (node instanceof HTMLElement) {
						this.initWidgets(node);
					}
				}
			}
		});
		this._observer.observe(document.body, { childList: true, subtree: true });
	},

	run() {
		this.initWidgets(document);
		this.watchDOM();
	}
};

document.addEventListener("DOMContentLoaded", () => {
	BwpWidgetRegistry.run();
});
