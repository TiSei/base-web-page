function runLayoutApi() {
	let script = document.querySelector('script[bwp-layout-data]');
	let array = JSON.parse(script.getAttribute('bwp-layout-data'));
	if (array.indexOf('TopJumper') != -1)
		L_addTopJumper();
	if (array.indexOf('SearchBar') != -1)
		L_addSearchBar();
}

runLayoutApi();

function L_addTopJumper() {
	let btn = createElement('button',['bwp-none','bwp-top-jumper'],{'onClick':'L_jumpToTop()'},'&#9650;');
	document.body.appendChild(btn);
	window.addEventListener('scroll', function() {
		if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
			btn.classList.remove('bwp-none');
		} else {
			btn.classList.add('bwp-none');
		}
	});
}

function L_jumpToTop() {
	document.body.scrollTop = 0; // For Safari
	document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

function L_addSearchBar() {
	let inputs = document.getElementsByClassName('bwp-search-bar');
	for (let input of inputs) {
		input.placeholder = 'Suche';
		input.addEventListener('keydown', function(event) {
			if (event.key === "Enter" || event.keyCode == '39') {
				event.preventDefault();
				window.find(event.target.value);
			}
		});
	}
}
