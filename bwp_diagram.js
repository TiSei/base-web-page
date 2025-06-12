const Radius = 90;
const TextRadius = 65;
const Color_Palette = ['bwp-dc1','bwp-dc2','bwp-dc3','bwp-dc4','bwp-dc5'];

function runChartApi() {
	let chart_list = document.querySelectorAll('svg[bwp-chart-type][bwp-chart-data]');
	for (let chart of chart_list) {
		let data = JSON.parse(chart.getAttribute('bwp-chart-data'));
		switch (chart.getAttribute('bwp-chart-type')) {
			case 'piechart':
				if (data.length < 1 || data.length > 5)
					console.error('Invalid Inline Data, attribute "bwp-chart-data" is to long (only support less than 6)');
				PC_drawPieChart(chart,data,
					Color_Palette.slice(0, data.length),
					chart.hasAttribute('bwp-chart-legend') ? JSON.parse(chart.getAttribute('bwp-chart-legend')) : []);
				break;
			case 'columnchart':
				if (data.length < 1 || data.length > 5)
					console.error('Invalid Inline Data, attribute "bwp-chart-data" is to long (only support less than 6)');
				CC_drawColumnChart(chart,data,
					Color_Palette.slice(0, data.length),
					chart.hasAttribute('bwp-chart-baseline') ? parseInt(chart.getAttribute('bwp-chart-baseline')) : NaN,
					chart.hasAttribute('bwp-chart-legend') ? JSON.parse(chart.getAttribute('bwp-chart-legend')) : []);
				break;
			default:
				console.error('Not supported chart type: '+chart.getAttribute('bwp-chart-type'));
				break;
		}
	}
}

runChartApi();

function C_getSVGText(x, y, innerText, classes) {
	return createElement(["http://www.w3.org/2000/svg", "text"],classes,{'x':x,'y':y},innerText);
}

function C_getSVGPath(d, transform, classes) {
	return createElement(["http://www.w3.org/2000/svg", "path"],classes,{'d':d,'transform':transform},'');
}

// piechart
function PC_drawPieChart(svg, pieces, colors, legends = []) {
	if ((colors.length != pieces.length))
		console.error("Invalid inputs, pieces und colors has different lengths");
	if (round(sum(pieces)) != 100)
		console.error("Invalid inputs, pieces not match 100% => " + sum(pieces));
	if (legends.length != 0 && legends.length != pieces.length)
		console.error("Invalid inputs, pieces und legends has different lengths");
	svg.classList.add(...['bwp-piechart','bwp-chart']);
	svg.setAttribute('viewBox','-100 -100 '+(legends.length != 0 ? 400 : 200)+' 200');
	let sum_pieces = 0;
	let step = Math.min(Math.round(160/legends.length), 20);
	for (let i = 0; i < pieces.length; i++) {
		let g = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-chart-piece'],{},'');
		g.appendChild(PC_getPathOfPiece(pieces[i],sum_pieces*3.6,colors[i]));
		g.appendChild(PC_getTextOfPiece(pieces[i],sum_pieces));
		if (legends.length != 0)
			g.appendChild(PC_getLegendTextOfPiece(legends[i],colors[i],step,i));
		svg.appendChild(g);
		sum_pieces += pieces[i];
	}
}

function PC_getTextOfPiece(piece, sum_pieces) {
	radian = toRadian((0.5*piece+sum_pieces)*3.6)
	x = round(TextRadius * Math.sin(radian),3);
	y = round(TextRadius * -Math.cos(radian),3);
	return C_getSVGText(x, y, round(piece,1), ['bwp-chart-piece-text']);
}

function PC_getPathOfPiece(piece, rotation, color) {
	radian = toRadian(piece*3.6);
	x = round(Radius * Math.sin(radian),3);
	y = round(Radius * (1-Math.cos(radian)),3);
	large_arc = piece*3.6 > 180 ? 1 : 0;
	if (round(piece) == 100)
		d = `M0,0 m${Radius},0 a${Radius},${Radius} 0 1,0 -${2*Radius},0 a${Radius},${Radius} 0 1,0 ${2*Radius},0`;
	else
		d = `M0,0 v-${Radius} a${Radius},${Radius} 0 ${large_arc} 1 ${x},${y}`;
	return C_getSVGPath(d, `rotate(${rotation})`, [color, 'bwp-chart-piece-path']);
}

function PC_getLegendTextOfPiece(legend,color,step,index) {
	return C_getSVGText(110, (index+0.5)*step-80, legend, [color, 'bwp-chart-legend-text']);
}

// columnchart
function CC_drawColumnChart(svg, pieces, colors, baseline = NaN, legends = []) {
	if ((colors.length != pieces.length))
		console.error("Invalid inputs, pieces und colors has different lengths");
	if (legends.length != 0 && legends.length != pieces.length)
		console.error("Invalid inputs, pieces und legends has different lengths");
	// Scale Calculation
	svg.classList.add(...['bwp-columnchart','bwp-chart']);
	let min_value = Math.min(...pieces);
	baseline = isNaN(baseline) ? round(min_value - Math.abs(min_value) * 0.1) : baseline;
	diff = round(Math.max(...pieces)*1.1) - baseline;
	scale = [baseline, round(baseline+0.2*diff,1), round(baseline+0.4*diff,1), round(baseline+0.6*diff,1), round(baseline+0.8*diff,1), baseline+diff];
	svg.setAttribute('viewBox','-40 -170 '+(legends.length != 0 ? 400 : 200)+' 200');
	// Scale
	let g_scale = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-chart-scale'],{},'');
	let g_grid = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-chart-grid'],{},'');
	g_scale.appendChild(C_getSVGPath('M 0 -160 v 160 h 150','',['bwp-chart-scaleline']));
	if (baseline < 0)
		g_scale.appendChild(C_getSVGPath('M 0 -'+(-baseline/diff*150)+' h 150','',['bwp-chart-scaleline', 'bwp-chart-zeroline']));
	for (let i = 0; i < scale.length; i++) {
		g_scale.appendChild(C_getSVGText(-35,-144+i*30,scale[scale.length-i-1],['bwp-chart-scaletext']));
		g_grid.appendChild(C_getSVGPath('M 0 '+(-150+i*30)+' h 150','',['bwp-chart-gridline']));
	}
	svg.appendChild(g_scale);
	svg.appendChild(g_grid);
	// Pieces
	for (let i = 0; i < pieces.length; i++) {
		let g = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-chart-piece'],{},'');
		g.appendChild(CC_getPathOfPiece(pieces[i],i,colors[i],pieces.length,baseline,diff));
		g.appendChild(CC_getTextOfPiece(pieces[i],i,pieces.length,baseline,diff));
		if (legends.length != 0)
			g.appendChild(CC_getLegendTextOfPiece(legends[i],colors[i],i));
		svg.appendChild(g);
	}
}

function CC_getPathOfPiece(piece, position, color, length, base, diff) {
	space = round(150/length);
	x1 = position*space+5;
	x2 = space-10;
	scaled_piece = (piece-base)/diff*150;
	d = `M ${x1} 0 v -${scaled_piece} h ${x2} v ${scaled_piece} Z`;
	return C_getSVGPath(d, '', [color, 'bwp-chart-piece-path']);
}

function CC_getTextOfPiece(piece, position, length, base, diff) {
	x = round(150/length)*(position+0.5);
	y = (piece-base)/diff*75;
	return C_getSVGText(x, -y, round(piece,1), ['bwp-chart-piece-text']);
}

function CC_getLegendTextOfPiece(legend,color,index) {
	return C_getSVGText(170, (index+0.5)*20-150, legend, [color, 'bwp-chart-legend-text']);
}
