class BWP_Popup {
	constructor(popup) {
		this.popup = popup
		popup._popup = this
		this.overlay = document.getElementById('bwp-popup-overlay')
		if (!this.overlay) {
			this.overlay = createElement('div',[],{'id':'bwp-popup-overlay'});
			this.overlay.addEventListener('click', (e) => { e.target._popup.hide() });
			document.body.appendChild(this.overlay);
		}
	}
	toggleVisibility(show = true) {
		this.popup.classList.toggle('bwp-popup-show', show);
		this.overlay.classList.toggle('bwp-popup-overlay-show', show);
		this.overlay._popup = show ? this : null;
	}
	show() { this.toggleVisibility(true) }
	hide() { this.toggleVisibility(false) }
}

class BWP_ImageZoomPopup {
	constructor() {
		let image_zoom_popup = createElement('div',['bwp-popup'],{'id':'bwp-image-zoom-popup'});
		this.img = createElement('img',[])
		image_zoom_popup.appendChild(this.img);
		document.body.appendChild(image_zoom_popup);
		this.popup = new BWP_Popup(image_zoom_popup)
	}
	show(src) {
		this.img.src = src;
		this.popup.show();
	}
	attachDelegated(selector = "img.bwp-image-zoom") {
		document.addEventListener("click", e => {
			if (e.target.tagName === "IMG" && e.target.matches(selector)) {
				this.show(e.target.src);
			}
		});
	}
}

class BWP_SearchBar {
	constructor(input) {
		this.input = input;
		input.placeholder = 'Search';
		input.addEventListener('keydown', function(event) {
			if (event.key === "Enter" || event.keyCode == '39') {
				event.preventDefault();
				window.find(event.target.value);
			}
		});
	}
}

class BWP_Menu {
	constructor(navbar) {
		this.navbar = navbar;
		if ("bwpMenuSource" in navbar.dataset) {
			universalFetchAsync({
				url:navbar.dataset.bwpMenuSource,
				responseType: 'json',
				onSuccess: data => { this.updateView(data); },
				onError: err => { this.updateView({}); }
			});
		} else if ("bwpMenuPlain" in navbar.dataset) {
			this.updateView(JSON.parse(navbar.dataset.bwpMenuPlain));
		} else {
			console.error('Invalid menu input, "data-bwp-menu-source" or "data-bwp-menu-plain" is not defined');
		}
	}
	updateView(data) {
		this.activeHref = '';
		for (let key of Object.keys(data)) {
			this.navbar.appendChild(data[key].constructor == Object ? this.makeDropdownMenuItem(key, data[key]) : this.makeMenuItem(key, data[key]));
		}
		if (this.activeHref !== '')
			document.querySelector('#menu a[href="'+this.activeHref+'"]').classList.add('bwp-menu-active');
	}
	makeMenuItem(label, href) {
		if (!href.startsWith('#') && window.location.pathname.includes(href) && href.length > this.activeHref.length)
			this.activeHref = href;
		return createElement('a',[],{'href':href},label);
	}
	makeDropdownMenuItem(label, items) {
		let dropdown = createElement('div',['bwp-dropdown']);
		dropdown.appendChild(createElement('div',['bwp-dropbtn'],{},label));
		let content = createElement('div',['bwp-dropdown-content']);
		for (let key of Object.keys(items)) {
			content.appendChild(this.makeMenuItem(key,items[key]));
		}
		dropdown.appendChild(content);
		return dropdown;
	}
}

function L_watchDOMManipulations() {
	const observer = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (!(node instanceof HTMLElement)) continue;
				const widgetMap = {
					'.bwp-popup': BWP_Popup,
					'.bwp-search-bar': BWP_SearchBar,
					'.bwp-navbar': BWP_Menu,
				};
				for (const [selector, Widget] of Object.entries(widgetMap)) {
					const target = node.matches(selector) ? node : node.querySelector(selector);
					if (target) {
						new Widget(target);
					}
				}
			}
		}
	});
	observer.observe(document.body, { childList: true, subtree: true });
}

function runLayoutApi() {
	let btn = createElement('button',['bwp-btn','bwp-none','bwp-top-jumper'],{},'&#9650;');
	btn.addEventListener('click', () => {
		document.body.scrollTop = 0; // For Safari
		document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
	});
	document.body.appendChild(btn);
	window.addEventListener('scroll', function() {
		btn.classList.toggle('bwp-none', !(document.body.scrollTop > 20 || document.documentElement.scrollTop > 20));
	});
	new BWP_ImageZoomPopup().attachDelegated();
	document.querySelectorAll(".bwp-popup").forEach(el => new BWP_Popup(el));
	document.querySelectorAll(".bwp-search-bar").forEach(el => new BWP_SearchBar(el));
	document.querySelectorAll(".bwp-navbar").forEach(el => new BWP_Menu(el));
	L_watchDOMManipulations();
}

runLayoutApi();
