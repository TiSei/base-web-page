let slide_idx;
let show_timer;

function runSideShowApi() {
	let boxes = document.querySelectorAll('.bwp-sideshow-container');
	slide_idx = Array(boxes.length).fill(-1);
	show_timer = Array(boxes.length);
	for (let index = 0; index < boxes.length; index++) {
		let box = boxes[index];
		let frame = createElement(box.getAttribute('bwp-sideshow-type'),['bwp-sideshow'],{},'');
		box.appendChild(frame);
		box.setAttribute('bwp-sideshow-index', index);
		frame.addEventListener('load', function(e) { e.target.classList.add('bwp-fade-in'); });		
		if (box.hasAttribute('bwp-sideshow-data-source')) {
			SS_callNextValue(box, true);
			return;
		}
		SS_initMenu(box);
		SS_Navigate(index);
	}
}

runSideShowApi();

function SS_Navigate(index, idx) {
	let frame = document.querySelector('.bwp-sideshow-container[bwp-sideshow-index="'+index+'"] > .bwp-sideshow');
	let box = frame.parentElement;
	clearTimeout(show_timer[index]);
	if (idx != undefined && idx == slide_idx[index] && frame.classList.contains('bwp-fade-in')) {
		SS_toggleMenu(box, 'stop');
		return;
	}
	if (frame.classList.contains('bwp-fade-in')) {
		frame.classList.remove('bwp-fade-in');
		show_timer[index] = setTimeout('SS_Navigate('+index+','+idx+')', 2000);
		return;
	}
	let values = SS_getSlideValues(box);
	if (idx != undefined) {
		slide_idx[index] = idx;
		SS_toggleMenu(box, 'stop');
	} else {
		slide_idx[index] = values.length == 1 ? 0 : (slide_idx[index] + 1) % values.length;
		show_timer[index] = setTimeout('SS_Navigate('+index+')', values[slide_idx[index]][2]*1000);
	}
	frame.src = values[slide_idx[index]][0];
}

function SS_getSlideValues(box) {
	let data = JSON.parse(box.getAttribute('bwp-sideshow-data'));
	if (box.hasAttribute('bwp-sideshow-recall'))
		SS_callNextValue(box);
	return data;
}

function SS_callNextValue(box, first_call) {
	fetch(box.getAttribute('bwp-sideshow-data-source')).then(function(response) {
		return response.text();
	}).then(function(data) {
		box.setAttribute('bwp-sideshow-data', data);
		if (!first_call)
			return;
		SS_initMenu(box);
		SS_Navigate(box.getAttribute('bwp-sideshow-index'));
	}).catch(function(err) {
		console.log('url request error', err);
	});
}

function SS_initMenu(box) {
	if (box.hasAttribute('bwp-sideshow-noMenu'))
		return;
	let div = createElement('div',['bwp-sideshow-menu'],{},'<b>Sideshow - Menü</b><br/>');
	let index = box.getAttribute('bwp-sideshow-index');
	if (!box.hasAttribute('bwp-sideshow-recall')) {
		let data = JSON.parse(box.getAttribute('bwp-sideshow-data'));
		let html = '<ol>';
		for (let i = 0; i < data.length; i++) {
			html += '<li>&emsp;<a href="javascript:SS_Navigate('+index+','+i+')">'+data[i][1]+'</a></li>';
		}
		div.innerHTML += html + '</ol>';
	}
	let btn = createElement('button',['bwp-btn'],{},'&#10073;&#10073;');
	btn.addEventListener('click', function(e) { let idx = e.target.parentElement.parentElement.getAttribute('bwp-sideshow-index'); SS_Navigate(idx,slide_idx[idx]); });
	div.appendChild(btn);
	btn = createElement('button',['bwp-btn','bwp-none'],{},'&#9658;');
	btn.addEventListener('click', function(e) { let box = e.target.parentElement.parentElement; SS_Navigate(box.getAttribute('bwp-sideshow-index')); SS_toggleMenu(box, 'play'); });
	div.appendChild(btn);
	div.appendChild(createElement('button',['bwp-btn'],{'onClick':'javascript:location.reload()'},'&#8634;'));
	box.appendChild(div);
}

function SS_toggleMenu(box, mode) {
	if (box.hasAttribute('bwp-sideshow-noMenu'))
		return;
	let btn = box.querySelectorAll('.bwp-sideshow-menu .bwp-btn');
	btn[0].classList.toggle('bwp-none', mode == 'stop');
	btn[1].classList.toggle('bwp-none', mode != 'stop');
}