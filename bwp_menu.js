function runMenuApi() {
	let menu_list = document.getElementsByClassName('bwp-navbar');
	for (let menu of menu_list) {
		if (!menu.hasAttribute('bwp-menu-data')) {
			console.error('Invalid menu input, "bwp-menu-data" is not defined');
		} else {
			M_updateMenu(menu, JSON.parse(menu.getAttribute("bwp-menu-data")));
		}
	}
}

runMenuApi();

function M_updateMenu(menu, dict) {
	if (dict.constructor == Object) {
		activeHref = '';
		for (let key of Object.keys(dict)) {
			menu.appendChild(dict[key].constructor == Object ? M_newDropdownMenuItem(key, dict[key]) : M_newMenuItem(key, dict[key]));
		}
		if (activeHref !== '')
			document.querySelector('#menu a[href="'+activeHref+'"]').classList.add('bwp-menu-active');
	} else {
		fetch(dict).then(function(response) {
			return response.json();
		}).then(function(data) {
			M_updateMenu(menu, data);
		}).catch(function(err) {
			console.error('url request error', err);
		});
	}
}

function M_newMenuItem(label, href, forceActive = true) {
	if (!href.startsWith('#') && window.location.pathname.includes(href) && href.length > activeHref.length)
		activeHref = href;
	return createElement('a',[],{'href':href},label);
}

function M_newDropdownMenuItem(label, items) {
	let dropdown = createElement('div',['bwp-dropdown']);
	dropdown.appendChild(createElement('div',['bwp-dropbtn'],{},label));
	let content = createElement('div',['bwp-dropdown-content']);
	for (let key of Object.keys(items)) {
		content.appendChild(M_newMenuItem(key,items[key]));
	}
	dropdown.appendChild(content);
	return dropdown;
}
