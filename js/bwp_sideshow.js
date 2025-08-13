function runSideShowApi() {
	let boxes = document.querySelectorAll('.bwp-sideshow-container');
	for (let i = 0; i < boxes.length; i++) {
		let box = boxes[i];
		let frame = createElement(box.getAttribute('bwp-sideshow-type'),['bwp-sideshow']);
		box.appendChild(frame);
		box.setAttribute('bwp-sideshow-id', i+1);
		frame.addEventListener('load', function(e) { e.target.classList.add('bwp-fade-in'); });
		SS_Refresh(i+1);
	}
}

runSideShowApi();

function SS_Refresh(id, supressFetch = false) {
	let box = document.querySelector(`.bwp-sideshow-container[bwp-sideshow-id="${id}"]`);
	if (box.hasAttribute('bwp-sideshow-timer'))
		clearTimeout(parseInt(box.getAttribute('box-sideshow-timer')));
	if (!supressFetch && box.hasAttribute('bwp-sideshow-data-source')) {
		box.removeAttribute('bwp-sideshow-data');
		SS_fetchData(box);
		return;
	}
	box.setAttribute('bwp-sideshow-idx', -1);
	box.querySelector('.bwp-sideshow').classList.remove('bwp-none');
	SS_refreshMenu(box);
	SS_Navigate(id);
}

function SS_fetchData(box) {
	if (box.hasAttribute('bwp-sideshow-recall'))
		setTimeout(() => { SS_fetchData(box); }, parseInt(box.getAttribute('bwp-sideshow-recall')));
	universalFetchAsync({
		url: box.getAttribute('bwp-sideshow-data-source'),
		onSuccess: data => {
			box.setAttribute('bwp-sideshow-data', data);
			SS_Refresh(parseInt(box.getAttribute('bwp-sideshow-id')), true);
		},
		onError: err => {
			box.querySelector('.bwp-sideshow').classList.add('bwp-none');
			SS_refreshMenu(box);
		}
	});
}

function SS_Navigate(id, idx) {
	let frame = document.querySelector(`.bwp-sideshow-container[bwp-sideshow-id="${id}"] > .bwp-sideshow`);
	let box = frame.parentElement;
	let current_idx = parseInt(box.getAttribute('bwp-sideshow-idx'));
	clearTimeout(parseInt(box.getAttribute('bwp-sideshow-timer')));
	if (idx === -1) idx = current_idx;
	if (idx != undefined && idx == current_idx && frame.classList.contains('bwp-fade-in')) {
		SS_toggleMenu(box, 'stop');
		return;
	}
	if (frame.classList.contains('bwp-fade-in')) {
		frame.classList.remove('bwp-fade-in');
		box.setAttribute('bwp-sideshow-timer', setTimeout(`SS_Navigate(${id},${idx})`, 2000));
		return;
	}
	let data = JSON.parse(box.getAttribute('bwp-sideshow-data'));
	if (data === null || data.length <= current_idx)
		return;
	let new_idx = idx;
	if (idx != undefined) {
		SS_toggleMenu(box, 'stop');
	} else {
		new_idx = (current_idx + 1) % data.length;
		box.setAttribute('bwp-sideshow-timer', setTimeout(`SS_Navigate(${id})`, data[new_idx][2] * 1000));
	}
	box.setAttribute('bwp-sideshow-idx', new_idx);
	frame.src = data[new_idx][0];
}

function SS_refreshMenu(box) {
	if (box.hasAttribute('bwp-sideshow-noMenu'))
		return;
	let div = box.querySelector('.bwp-sideshow-menu');
	if (div === null) {
		div = createElement('div',['bwp-sideshow-menu']);
		box.appendChild(div);
	} else
		div.replaceChildren();
	div.innerHTML = '<b>Sideshow - Menu</b><br/>';
	let id = box.getAttribute('bwp-sideshow-id');
	if (box.hasAttribute('bwp-sideshow-data')) {
		let data = JSON.parse(box.getAttribute('bwp-sideshow-data'));
		let ol = createElement('ol',[]);
		for (let i = 0; i < data.length; i++) { ol.appendChild(createElement('li',[],{},`&emsp;<a href="javascript:SS_Navigate(${id},${i})">${data[i][1]}</a>`)); }
		div.appendChild(ol);
		div.appendChild(createElement('button',['bwp-btn'],{},'&#10073;&#10073;'));
		div.lastChild.addEventListener('click', function(e) { SS_Navigate(id, -1); });
		div.appendChild(createElement('button',['bwp-btn','bwp-none'],{},'&#9658;'));
		div.lastChild.addEventListener('click', function(e) { let box_ref = e.target.parentElement.parentElement; SS_Navigate(id); SS_toggleMenu(box_ref, 'play'); });
	} else {
		div.appendChild(createElement('span',['bwp-sideshow-error'],{},'API-Request failed'));
		div.innerHTML += '<br/>';
	}
	div.appendChild(createElement('button',['bwp-btn'],{'onClick':`javascript:SS_Refresh(${id})`},'&#8634;'));
}

function SS_toggleMenu(box, mode) {
	if (box.hasAttribute('bwp-sideshow-noMenu'))
		return;
	let btn = box.querySelectorAll('.bwp-sideshow-menu .bwp-btn');
	btn[0].classList.toggle('bwp-none', mode == 'stop');
	btn[1].classList.toggle('bwp-none', mode != 'stop');
}