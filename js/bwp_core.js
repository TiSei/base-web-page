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

class BwpDataSource {
	constructor({ url = null, recall = null, transform = null, responseType = 'json', ignoreNotModified = false, noCache = false, inline = null } = {}) {
		this.url = url;
		this.recall = recall;
		this.transform = transform;
		this.responseType = responseType;
		this.ignoreNotModified = ignoreNotModified;
		this.noCache = noCache;
		this.inline = inline;
		this._interval =  null;
		this._listeners = new Map();
		this._lastData = null;
	}
	applyTransform(data, el) {
		if (typeof this.transform === "function")
			return this.transform(data);
		return data;
	}
	_fetch() {
		if (this.url) {
			universalFetchAsync({
				url: this.url,
				responseType: this.responseType,
				ignoreNotModified: this.ignoreNotModified,
				noCache: this.noCache,
				onSuccess: data => this._notifyListeners(this.applyTransform(data)),
				onError: err => {
					for (const { onError } of this._listeners.values()) {
						if (typeof onError === "function") onError(err);
					}
				}
			});
		} else
			this._notifyListeners(this.applyTransform(this.inline));
	}
	_notifyListeners(data) {
		this._lastData = data;
		for (const callback of this._listeners.keys()) {
			try {
				callback(data);
			} catch (e) {
				console.error("Listener callback failed:", e);
			}
		}
	}
	subscribe(callback, onError = null) {
		if (typeof callback !== "function") return;
		this._listeners.set(callback, { onError });
		if (this._lastData !== null) {
			callback(this._lastData);
			return;
		}
		if (!this._interval && this.url && this.recall)
			this._interval = setInterval(() => this._fetch(), parseInt(this.recall) * 1000);
		this._fetch();
	}
	unsubscribe(callback) {
		this._listeners.delete(callback);
		if (this._listeners.size === 0) {
			if (this._interval) {
				clearInterval(this._interval);
				this._interval = null;
			}
		}
	}
	oneTimeSubscribe(callback, onError = null) {
		if (typeof callback !== "function") return;
		const wrapper = (data) => {
			try {
				callback(data);
			} finally {
				this.unsubscribe(wrapper);
			}
		};
		this.subscribe(wrapper, onError);
	}
}

const BwpDataSourceRegistry = {
	sources: new Map(),
	register(name, cfg) { this.sources.set(name, new BwpDataSource(cfg)); },
	get(name) { return this.sources.get(name) || null; }
};