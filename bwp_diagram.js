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
		let g = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-piechart-piece'],{},'');
		g.appendChild(PC_getPathOfPiece(pieces[i],sum_pieces*3.6,colors[i]));
		g.appendChild(PC_getTextOfPiece(pieces[i],sum_pieces));
		if (legends.length != 0) {
			g.appendChild(PC_getLegendTextOfPiece(legends[i],colors[i],step,i));
			svg.classList.add('bwp-legend-chart');
		}
		svg.appendChild(g);
		sum_pieces += pieces[i];
	}
}

function PC_getTextOfPiece(piece, sum_pieces) {
	radian = toRadian((0.5*piece+sum_pieces)*3.6)
	x = round(TextRadius * Math.sin(radian),3);
	y = round(TextRadius * -Math.cos(radian),3);
	return C_getSVGText(x, y, round(piece,1), ['bwp-piechart-piece-text']);
}

function PC_getPathOfPiece(piece, rotation, color) {
	radian = toRadian(piece*3.6);
	x = round(Radius * Math.sin(radian),3);
	y = round(Radius * (1-Math.cos(radian)),3);
	large_arc = piece*3.6 > 180 ? 1 : 0;
	d = `M0,0 v-${Radius} a${Radius},${Radius} 0 ${large_arc} 1 ${x},${y}`;
	return C_getSVGPath(d, `rotate(${rotation})`, [color, 'bwp-piechart-piece-path']);
}

function PC_getLegendTextOfPiece(legend,color,step,index) {
	return C_getSVGText(120, (index+0.5)*step-80, legend, [color, 'bwp-piechart-legend-text', 'bwp-chart-legend-text']);
}
