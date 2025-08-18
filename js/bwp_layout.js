function runLayoutApi() {
	L_addTopJumper();
	L_addSearchBar();
	let image_zoom = document.getElementsByClassName('bwp-image-zoom');
	if (image_zoom.length > 0) {
		let image_zoom_popup = createElement('div',['bwp-popup'],{'id':'bwp-image-zoom-popup'});
		image_zoom_popup.appendChild(createElement('img',[]));
		document.body.appendChild(image_zoom_popup);
		for (let img of image_zoom) {
			img.addEventListener('click', () => { L_showImageZoomPopup(img) });
		}
	}
	if (document.getElementsByClassName('bwp-popup').length > 0) {
		let overlay = createElement('div',[],{'id':'bwp-popup-overlay'});
		overlay.addEventListener('click', () => { L_hidePopup() });
		document.body.appendChild(overlay);
	}
}

runLayoutApi();

function L_addTopJumper() {
	let btn = createElement('button',['bwp-btn','bwp-none','bwp-top-jumper'],{'onClick':'L_jumpToTop()'},'&#9650;');
	document.body.appendChild(btn);
	window.addEventListener('scroll', function() {
		btn.classList.toggle('bwp-none', !(document.body.scrollTop > 20 || document.documentElement.scrollTop > 20));
	});
}

function L_jumpToTop() {
	document.body.scrollTop = 0; // For Safari
	document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

function L_addSearchBar() {
	let inputs = document.getElementsByClassName('bwp-search-bar');
	for (let input of inputs) {
		input.placeholder = 'Search';
		input.addEventListener('keydown', function(event) {
			if (event.key === "Enter" || event.keyCode == '39') {
				event.preventDefault();
				window.find(event.target.value);
			}
		});
	}
}

function L_showPopup(popup) {
	popup.classList.add('bwp-popup-show');
	document.getElementById('bwp-popup-overlay').classList.add('bwp-popup-overlay-show');
}

function L_hidePopup() {
	let popups = document.getElementsByClassName('bwp-popup-show');
	for (let popup of popups) { popup.classList.remove('bwp-popup-show'); }
	document.getElementById('bwp-popup-overlay').classList.remove('bwp-popup-overlay-show');
}

function L_showImageZoomPopup(img) {
	let zoom_image_popup = document.getElementById('bwp-image-zoom-popup');
	let zoom_image = zoom_image_popup.children[0];
	zoom_image.src = img.src;
	L_showPopup(zoom_image_popup);
}
