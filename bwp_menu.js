function runMenuApi() {
	let menu_list = document.getElementsByClassName('bwp-navbar');
	for (let menu of menu_list) {
		if (!menu.hasAttribute('bwp-menu-data'))
			console.error('Invalid menu input, "bwp-menu-data" is not defined');
		M_updateMenu(menu, JSON.parse(menu.getAttribute("bwp-menu-data")));
	}
}

runMenuApi();

function M_updateMenu(menu, columnlist, recall=false) {
	if (columnlist['menu'] === undefined && columnlist['url'] === undefined)
		console.error("No data set (menu, url): Cannot load data for menu: "+menu);
	if (columnlist['url'] !== undefined && recall)
		console.error("Reverse url request: Cannot load data for menu: "+menu);
	if (columnlist['url']!== undefined) {
		fetch(columnlist['url']).then(function(response) {
			return response.json();
		}).then(function(data) {
			M_updateMenu(menu, data, true);
		}).catch(function(err) {
			console.log('url request error', err);
		});
		return;
	}
	let items = columnlist['menu'];
	for (let key of Object.keys(items)) {
		menu.appendChild(items[key].constructor == Object ? M_newDropdownMenuItem(key, items[key]) : M_newMenuItem(key, items[key]));
	}
}

function M_newMenuItem(label, href) {
	return createElement('a',[],{'href':href},label);
}

function M_newDropdownMenuItem(label, items) {
	let dropdown = createElement('div',['bwp-dropdown'],{},'');
	dropdown.appendChild(createElement('div',['bwp-dropbtn'],{},label));
	let content = createElement('div',['bwp-dropdown-content'],{},'');
	for (let key of Object.keys(items)) {
		content.appendChild(createElement('a',[],{'href':items[key]},key));
	}
	dropdown.appendChild(content);
	return dropdown;
}
