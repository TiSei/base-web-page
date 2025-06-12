const Radius = 90;
const TextRadius = 65;
const Color_Palette = ['bwp-dc1','bwp-dc2','bwp-dc3','bwp-dc4','bwp-dc5'];

function runChartApi() {
	let chart_list = document.querySelectorAll('svg[bwp-chart-type][bwp-chart-data]');
	for (let chart of chart_list) {
		let data = JSON.parse(chart.getAttribute('bwp-chart-data'));
		if (typeof data === 'string') {
			fetch(data).then(function(response) {
				return response.json();
			}).then(function(data) {
				C_processChart(chart, data);
			}).catch(function(err) {
				console.error('url request error', err);
			});
		} else
			C_processChart(chart, data);
	}
}

runChartApi();

function C_processData(data) {
	if (Array.isArray(data))
		return [ data, [] ];
	else if (typeof data === 'object' && data !== null)
		return [ Object.values(data), Object.keys(data) ];
	else
		console.error('not supported data structure: '+json);
}

function C_processChart(chart, data) {
	const [ values, legends ] = C_processData(data);
	if (values.length < 1 || values.length > 5)
		console.error('Invalid Data, to many values (only support less than 6)');
	if (legends.length != 0 && legends.length != values.length)
		console.error("Invalid inputs, pieces und legends has different lengths");
	switch (chart.getAttribute('bwp-chart-type')) {
		case 'piechart':
			if (round(sum(values)) != 100)
				console.error("Invalid inputs, pieces not match 100%: " + sum(values));
			PC_drawPieChart(chart,values,Color_Palette.slice(0, values.length),
				chart.hasAttribute('bwp-chart-legend') ? legends : []);
			break;
		case 'columnchart':
			CC_drawColumnChart(chart,values,Color_Palette.slice(0, values.length),
				chart.hasAttribute('bwp-scaled-chart-baseline') ? parseInt(chart.getAttribute('bwp-scaled-chart-baseline')) : NaN,
				chart.hasAttribute('bwp-chart-legend') ? legends : [],
				chart.hasAttribute('bwp-scaled-chart-x_width') ? parseInt(chart.getAttribute('bwp-scaled-chart-x_width')) : 150,
				chart.hasAttribute('bwp-scaled-chart-y_width') ? parseInt(chart.getAttribute('bwp-scaled-chart-y_width')) : 150);
			break;
		default:
			console.error('Not supported chart type: '+chart.getAttribute('bwp-chart-type'));
			break;
	}
}

function C_getSVGText(x, y, innerText, classes, lineHeight = 20) {
	const textEl = createElement(["http://www.w3.org/2000/svg", "text"],classes,{'x':x,'y':y});
	if (typeof innerText === 'string') {
		const lines = innerText.split(/\r?\n/); // handles \n or \r\n
		lines.forEach((line, index) => {
			const tspan = createElement(["http://www.w3.org/2000/svg", "tspan"],classes,{'x':x,'y':y + index * lineHeight});
			tspan.textContent = line.trim();
			textEl.appendChild(tspan);
		});
	} else
		textEl.innerHTML = innerText;
	return textEl;
}

function C_getSVGPath(d, transform, classes) {
	return createElement(["http://www.w3.org/2000/svg", "path"],classes,{'d':d,'transform':transform});
}

function C_getLegendText(legend, color, x, y, lineindex, step = 20) {
	return C_getSVGText(x, y + (lineindex+0.5)*step, legend, [color, 'bwp-chart-legend-text'], step);
}

function C_getScaledChart(svg, value_y_min, value_y_max, value_x_min, value_x_max, baseline = NaN, x_width = 150, y_width = 150, hide_Legend = false) {
	// Scale Calculation
	baseline = isNaN(baseline) ? round(value_y_min - Math.abs(value_y_min) * 0.1) : baseline;
	const diff_x = value_x_max - value_x_min;
	const diff_y = round(value_y_max + Math.abs(value_y_max) * 0.1) - baseline;
	const steps = [0, 0.2, 0.4, 0.6, 0.8, 1];
	const scale_x = steps.map(s => round((value_x_min + s * diff_x),1));
	const scale_y = steps.map(s => round((baseline + s * diff_y),1));
	console.log(scale_y);
	// Set Display
	svg.setAttribute('viewBox',`-40 -${y_width+20} ${(hide_Legend ? x_width + 50 : x_width + 250)} ${50+y_width}`);
	// Scale
	let g_scale_x = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-chart-scale','bwp-chart-scale-x']);
	let g_scale_y = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-chart-scale','bwp-chart-scale-y']);
	let g_axes = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-chart-axes']);
	let g_grid = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-chart-grid']);
	g_axes.appendChild(C_getSVGPath(`M 0 -${10+y_width} v ${10+y_width} h ${x_width}`,'',['bwp-chart-scaleline']));
	if (baseline < 0)
		g_axes.appendChild(C_getSVGPath(`M 0 ${baseline/diff_y*y_width} h ${x_width}`,'',['bwp-chart-scaleline', 'bwp-chart-zeroline']));
	// Scale Notation
	for (let i = 0; i < scale_x.length; i++) {
		let step = round(x_width/(steps.length-1));
		g_scale_x.appendChild(C_getSVGText(i*step,20,scale_x[i],['bwp-chart-scaletext']));
	}
	for (let i = 0; i < scale_y.length; i++) {
		let step = round(y_width/(steps.length-1));
		g_scale_y.appendChild(C_getSVGText(-35,-i*step+6,scale_y[i],['bwp-chart-scaletext']));
		g_grid.appendChild(C_getSVGPath(`M 0 -${i*step} h ${x_width}`,'',['bwp-chart-gridline']));
	}
	svg.appendChild(g_axes);
	svg.appendChild(g_scale_x);
	svg.appendChild(g_scale_y);
	svg.appendChild(g_grid);
	return [baseline, diff_x, diff_y];
}

// piechart
function PC_drawPieChart(svg, pieces, colors, legends = []) {
	svg.classList.add(...['bwp-piechart','bwp-chart']);
	svg.setAttribute('viewBox','-100 -100 '+(legends.length != 0 ? 400 : 200)+' 200');
	let sum_pieces = 0;
	let step = Math.min(Math.round(160/legends.length), 20);
	let legend_offset = 0;
	for (let i = 0; i < pieces.length; i++) {
		let g = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-chart-piece']);
		g.appendChild(PC_getPathOfPiece(pieces[i],sum_pieces*3.6,colors[i]));
		g.appendChild(PC_getTextOfPiece(pieces[i],sum_pieces));
		if (legends.length != 0) {
			let textEl = C_getLegendText(legends[i], colors[i], 110, -80, i+legend_offset)
			legend_offset = legend_offset + textEl.childElementCount - 1;
			g.appendChild(textEl);
		}
		svg.appendChild(g);
		sum_pieces += pieces[i];
	}
}

function PC_getTextOfPiece(piece, sum_pieces) {
	radian = toRadian((0.5*piece+sum_pieces)*3.6)
	x = round(TextRadius * Math.sin(radian),3);
	y = round(TextRadius * -Math.cos(radian),3);
	return C_getSVGText(x, y, round(piece,1), ['bwp-chart-piece-label']);
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

// columnchart
function CC_drawColumnChart(svg, pieces, colors, baseline = NaN, legends = [], x_width = 150, y_width = 150) {
	svg.classList.add(...['bwp-columnchart','bwp-chart','bwp-scaled-chart']);
	const [baseline_calc, diff_x, diff_y] = C_getScaledChart(svg, Math.min(...pieces), Math.max(...pieces), 0, pieces.length, baseline, x_width, y_width, legends.length == 0);
	// Pieces
	let legend_offset = 0;
	for (let i = 0; i < pieces.length; i++) {
		let g = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-chart-piece']);
		g.appendChild(CC_getPathOfPiece(pieces[i],i,colors[i],round(x_width/pieces.length),baseline_calc,diff_y));
		g.appendChild(CC_getTextOfPiece(pieces[i],i,round(x_width/pieces.length),baseline_calc,diff_y));
		if (legends.length != 0) {
			let textEl = C_getLegendText(legends[i], colors[i], x_width + 20, -y_width, i+legend_offset)
			legend_offset = legend_offset + textEl.childElementCount - 1;
			g.appendChild(textEl);
		}
		svg.appendChild(g);
	}
}

function CC_getPathOfPiece(piece, position, color, space, base, diff) {
	x1 = position*space+5;
	x2 = space-10;
	scaled_piece = (piece-base)/diff*150;
	d = `M ${x1} 0 v -${scaled_piece} h ${x2} v ${scaled_piece} Z`;
	return C_getSVGPath(d, '', [color, 'bwp-chart-piece-path']);
}

function CC_getTextOfPiece(piece, position, space, base, diff) {
	x = space*(position+0.5);
	y = (piece-base)/diff*75;
	return C_getSVGText(x, -y, round(piece,1), ['bwp-chart-piece-label']);
}
