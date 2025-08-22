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
		const source = BwpDataSourceRegistry.get(navbar.dataset.bwpSource);
		if (source) {
			source.oneTimeSubscribe(
				data => this.updateView(data),
				err => this.updateView({}),
			);
		} else
			console.error('no DataSource '+navbar.dataset.bwpSource+' is registered');
	}
	updateView(data) {
		this.activeHref = '';
		for (let key of Object.keys(data)) {
			this.navbar.appendChild(data[key].constructor == Object ? this.makeDropdownMenuItem(key, data[key]) : this.makeMenuItem(key, data[key]));
		}
		if (this.activeHref !== '')
			document.querySelector('#menu a[href="'+this.activeHref+'"]').classList.add('bwp-is-active');
	}
	makeMenuItem(label, href) {
		if (!href.startsWith('#') && ((href.startsWith('.') && window.location.pathname.includes(href.slice(2))) || window.location.pathname.includes(href)) && href.length > this.activeHref.length)
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

class BWP_SlideShow {
	constructor(root) {
		this.root = root;
		this.index = 0;
		this.autoplay = ("bwpAutoplay" in root.dataset);
		if ("bwpSource" in root.dataset) {
			const source = BwpDataSourceRegistry.get(root.dataset.bwpSource);
			if (source) {
				source.subscribe(
					data => this.updateSlides(data),
					err => this.updateSlides([]),
				);
			} else
				console.error('no DataSource '+root.dataset.bwpSource+' is registered');
		} else
			this.updateView();
	}
	updateSlides(data) {
		this.root.innerHTML = '';
		let div_slides = createElement('div',['bwp-slides']);
		this.root.appendChild(div_slides);
		for (let url of data) {
			div_slides.appendChild(createElement((('bwpSlideType' in this.root.dataset) ? this.root.dataset.bwpSlideType : 'iframe'),[],{'src':url}));
		}
		this.updateView();
	}
	updateView() {
		this.stopAutoplay(true);
		this.slides = Array.from(this.root.querySelectorAll('.bwp-slides > *'));
		this.dotsWrap = createElement('div',['bwp-slideshow-dots']);
		this.root.appendChild(this.dotsWrap);
		this.dots = this.slides.map((_, i) => {
			const dot = createElement('button',['bwp-slideshow-dot']);
			dot.addEventListener("click", () => this.show(i));
			this.dotsWrap.appendChild(dot);
			return dot;
		});
		if (this.slides.length > 1) {
			let buttonWrap = createElement('div',['bwp-slideshow-controls']);
			let prevBtn = createElement('button',['bwp-slideshow-prev','bwp-slideshow-btn'],{},'<');
			prevBtn.addEventListener("click", () => this.prev());
			buttonWrap.appendChild(prevBtn);
			if (this.autoplay) {
				let centerButtonWrap = createElement('div',['bwp-sideshow-center-controls']);
				this.playBtn = createElement('button',['bwp-slideshow-play','bwp-slideshow-btn','bwp-none'],{},'&#9658;');
				this.playBtn.addEventListener("click", () => this.startAutoplay());
				centerButtonWrap.appendChild(this.playBtn);
				this.stopBtn = createElement('button',['bwp-slideshow-stop','bwp-slideshow-btn'],{},'&#10073;&#10073;');
				this.stopBtn.addEventListener("click", () => this.stopAutoplay());
				centerButtonWrap.appendChild(this.stopBtn);
				buttonWrap.appendChild(centerButtonWrap);
				this.interval = parseInt(this.root.dataset.bwpAutoplay) * 1000;
				this.startAutoplay();
			}
			let nextBtn = createElement('button',['bwp-slideshow-next','bwp-slideshow-btn'],{},'>');
			nextBtn.addEventListener("click", () => this.next());
			buttonWrap.appendChild(nextBtn);
			this.root.appendChild(buttonWrap);
		}
		this.show(this.index);
	}
	show(i) {
		this.index = (i + this.slides.length) % this.slides.length;
		this.slides.forEach((el, j) => el.classList.toggle("bwp-is-active", j === this.index));
		this.dots.forEach((d, j) => d.classList.toggle("bwp-is-active", j === this.index));
	}
	next() { this.show(this.index + 1); }
	prev() { this.show(this.index - 1); }
	startAutoplay() {
		this.stopAutoplay(true);
		this.playBtn.classList.add('bwp-none');
		this.stopBtn.classList.remove('bwp-none');
		this.timer = setInterval(() => this.next(), this.interval);
	}
	stopAutoplay(NoBtnChange = false) {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
		if (!NoBtnChange) {
			this.playBtn.classList.remove('bwp-none');
			this.stopBtn.classList.add('bwp-none');
		}
	}
}

BwpWidgetRegistry.register('.bwp-popup', BWP_Popup, false);
BwpWidgetRegistry.register('.bwp-search-bar', BWP_SearchBar, false);
BwpWidgetRegistry.register('.bwp-navbar[data-bwp-source]', BWP_Menu, false);
BwpWidgetRegistry.register('.bwp-slideshow', BWP_SlideShow, true);

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
}

runLayoutApi();
