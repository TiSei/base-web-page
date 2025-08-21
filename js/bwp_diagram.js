class BWP_ChartBase {
	static Color_Palette = ['bwp-dc1','bwp-dc2','bwp-dc3','bwp-dc4','bwp-dc5']
	constructor(chart) {
		this.chart = chart;
		this.chart._chart = this;
		this.config = {
			legend: this.chart.classList.contains('bwp-chart-has-legend'),
			legendWidth: chart.dataset.bwpLegendWidth ? parseInt(chart.dataset.bwpLegendWidth) : 200,
			data: chart.dataset.bwpData ? JSON.parse(chart.dataset.bwpData) : null,
			source: chart.dataset.bwpSource,
			recall: chart.dataset.bwpRecall ? parseInt(chart.dataset.bwpRecall) : NaN
		};
		this.extendConfig(chart);
		this.processChart();
	}
	extendConfig(chart) { }
	getColors(size) { return Array.from({ length: size }, (_, i) => BWP_ChartBase.Color_Palette[i % BWP_ChartBase.Color_Palette.length]); }
	createSVGPath(d, transform, classes) { return createElement(["http://www.w3.org/2000/svg", "path"],classes,{'d':d,'transform':transform}); }
	createSVGText(x, y, innerText, classes, lineHeight = 20) {
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
	createLegendItem(g, legend, color, x, y, offset, step = 20) {
		let textEl = this.createSVGText(x, y + (offset+0.5)*step, legend, [color, 'bwp-chart-legend-text'], step);
		g.appendChild(textEl);
		return offset + textEl.childElementCount;
	}
	processChart() {
		this.chart.innerHTML = '';
		this.chart.removeAttribute('viewBox');
		if (this.config.source) {
			const lambda = () => universalFetchAsync({
				url:this.config.source,
				responseType: 'json',
				onSuccess: data => { this.updateChart(data); },
				onError: err => { this.handleError('API-Request failed'); }
			});
			if (this.config.recall)
				setInterval(() => lambda(), parseInt(this.config.recall) * 1000);
			lambda();
		} else if (this.config.data)
			this.updateChart(this.config.data);
		else
			this.handleError('no data set');
	}
	handleError(msg) {
		this.chart.appendChild(createElement(
					["http://www.w3.org/2000/svg", "foreignObject"],
					['bwp-chart-error'],
					{ x: 0, y: 0, width: '100%', height: '100%' },
					'<div><span>'+msg+'</span><button class="bwp-btn" onClick="this.parentElement.parentElement.parentElement._chart.processChart())">Try again</button></div>'
				));
	}
	processData(data) {
		if (Array.isArray(data))
			return [ data, [] ];
		else if (typeof data === 'object' && data !== null)
			return [ Object.values(data), Object.keys(data) ];
		else {
			console.error('invalid data format, not supported data structure:', data);
			this.handleError('invalid data format');
		}
	}
	updateChart(data) {
		const [ values, legends ] = this.processData(data);
		if (legends.length != 0 && legends.length != values.length) {
			console.error("invalid data format, length of data and legends array do not match");
			this.handleError('invalid data format');
		}
		this.drawChart(values, this.getColors(values.length), legends);
	}
}

class BWP_ScaledChartBase extends BWP_ChartBase {
	constructor(chart) { super(chart); }
	extendConfig(chart) {
		super.extendConfig(chart);
		this.config = {
			...this.config,
			baseline: chart.dataset.bwpBaseline ? parseInt(chart.dataset.bwpBaseline) : NaN,
			xWidth: chart.dataset.bwpXWidth ? parseInt(chart.dataset.bwpXWidth) : 150,
			yWidth: chart.dataset.bwpYWidth ? parseInt(chart.dataset.bwpYWidth) : 150
		};
	}
	makeScaledChart(value_y_min, value_y_max, value_x_min, value_x_max) {
		// Scale Calculation
		const baseline = isNaN(this.config.baseline) ? ceilDown(value_y_min - 0.01) : this.config.baseline;
		const diff_x = ceilUp((value_x_max - value_x_min)/5)*5;
		const diff_y = ceilUp((value_y_max - baseline)/5)*5;
		const steps = [0, 0.2, 0.4, 0.6, 0.8, 1];
		const scale_x = steps.map(s => round((value_x_min + s * diff_x),1));
		const scale_y = steps.map(s => round((baseline + s * diff_y),1));
		// Set Display
		this.chart.classList.add('bwp-scaled-chart');
		this.chart.setAttribute('viewBox',`-30 -${this.config.yWidth+20} ${this.config.xWidth + 50 + (this.config.legend ? this.config.legendWidth : 0)} ${50+this.config.yWidth}`);
		// Scale
		let g_scale_x = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-chart-scale','bwp-chart-scale-x']);
		let g_scale_y = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-chart-scale','bwp-chart-scale-y']);
		let g_axes = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-chart-axes']);
		let g_grid = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-chart-grid']);
		g_axes.appendChild(this.createSVGPath(`M 0 -${10+this.config.yWidth} v ${10+this.config.yWidth} h ${this.config.xWidth+15}`,'',['bwp-chart-scaleline']));
		if (baseline < 0)
			g_axes.appendChild(this.createSVGPath(`M 0 ${baseline/diff_y*this.config.yWidth} h ${this.config.xWidth+15}`,'',['bwp-chart-scaleline', 'bwp-chart-zeroline']));
		// Scale Notation
		for (let i = 0; i < scale_x.length; i++) {
			let step = round(this.config.xWidth/(steps.length-1));
			g_scale_x.appendChild(this.createSVGText(i*step+5,20,scale_x[i],['bwp-chart-scaletext']));
		}
		for (let i = 0; i < scale_y.length; i++) {
			let step = round(this.config.yWidth/(steps.length-1));
			g_scale_y.appendChild(this.createSVGText(-25,-i*step+6,scale_y[i],['bwp-chart-scaletext']));
			g_grid.appendChild(this.createSVGPath(`M 0 -${i*step} h ${this.config.xWidth+10}`,'',['bwp-chart-gridline']));
		}
		this.chart.appendChild(g_axes);
		this.chart.appendChild(g_scale_x);
		this.chart.appendChild(g_scale_y);
		this.chart.appendChild(g_grid);
		return [value_x_min, baseline, this.config.xWidth/diff_x, this.config.yWidth/diff_y];
	}
}

class BWP_PieChart extends BWP_ChartBase {
	static Radius = 90;
	static TextRadius = 65;
	constructor(chart) { super(chart); }
	drawChart(values, colors, legends) {
		this.chart.classList.add('bwp-piechart');
		this.chart.setAttribute('viewBox',`-100 -100 ${200 + (this.config.legend ? this.config.legendWidth : 0)} 200`);
		let degree_per_value = round(360 / sum(values), 2);
		let sum_exe_values = 0;
		let step = Math.min(Math.round(160/legends.length), 20);
		let legend_offset = 0;
		for (let i = 0; i < values.length; i++) {
			let g = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-chart-piece']);
			g.appendChild(this.makePathOfPiece((i+1 != values.length ? values[i]*degree_per_value : 360-sum_exe_values*degree_per_value),sum_exe_values*degree_per_value,colors[i]));
			g.appendChild(this.makeTextOfPiece(values[i],(sum_exe_values+0.5*values[i])*degree_per_value));
			if (this.config.legend)
				legend_offset = this.createLegendItem(g, legends[i], colors[i], 110, -80, legend_offset);
			this.chart.appendChild(g);
			sum_exe_values += values[i];
		}
	}
	makeTextOfPiece(value, rotation) {
		let TextRadius = BWP_PieChart.TextRadius;
		let radian = toRadian(rotation);
		return this.createSVGText(round(TextRadius * Math.sin(radian),3), round(TextRadius * -Math.cos(radian),3), round(value,1), ['bwp-chart-piece-label']);
	}
	makePathOfPiece(angle, rotation, color) {
		let Radius = BWP_PieChart.Radius;
		let d = '';
		if (angle == 360)
			d = `M0,0 m${Radius},0 a${Radius},${Radius} 0 1,0 -${2*Radius},0 a${Radius},${Radius} 0 1,0 ${2*Radius},0`;
		else {
			let radian = toRadian(angle);
			let x = round(Radius * Math.sin(radian),3);
			let y = round(Radius * (1-Math.cos(radian)),3);
			d = `M0,0 v-${Radius} a${Radius},${Radius} 0 ${(angle > 180 ? 1 : 0)} 1 ${x},${y}`;
		}
		return this.createSVGPath(d, `rotate(${rotation})`, [color, 'bwp-chart-piece-path']);
	}
}

class BWP_ColumnChart extends BWP_ScaledChartBase {
	constructor(chart) { super(chart); }
	drawChart(values, colors, legends) {
		this.chart.classList.add('bwp-columnchart');
		const [x_axis, y_axis, diff_x, diff_y] = this.makeScaledChart(Math.min(...values), Math.max(...values), 0, values.length);
		// Values
		let legend_offset = 0;
		for (let i = 0; i < values.length; i++) {
			let g = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-chart-piece']);
			g.appendChild(this.makePathOfPiece(values[i],i,colors[i],round(this.config.xWidth/values.length),y_axis,diff_y));
			g.appendChild(this.makeTextOfPiece(values[i],i,round(this.config.xWidth/values.length),y_axis,diff_y));
			if (legends.length != 0)
				legend_offset = this.createLegendItem(g, legends[i], colors[i], this.config.xWidth + 20, -this.config.yWidth, legend_offset);
			this.chart.appendChild(g);
		}
	}
	makePathOfPiece(piece, position, color, space, base, diff) {
		return this.createSVGPath(`M ${position*space+5} 0 v -${(piece-base)*diff} h ${space-10} v ${(piece-base)*diff} Z`, '', [color, 'bwp-chart-piece-path']);
	}
	makeTextOfPiece(piece, position, space, base, diff) {
		return this.createSVGText(space*(position+0.5), -(piece-base)*diff-8, round(piece,1), ['bwp-chart-piece-label']);
	}
}

class BWP_LineChart extends BWP_ScaledChartBase {
	constructor(chart) { super(chart); }
	drawChart(values, colors, legends) {
		let y_min = Infinity, y_max = -Infinity;
		let x_min = Infinity, x_max = -Infinity;
		for (let series of values) {
			x_min = Math.min(x_min, ...series.map(([x, y]) => x));
			x_max = Math.max(x_max, ...series.map(([x, y]) => x));
			y_min = Math.min(y_min, ...series.map(([x, y]) => y));
			y_max = Math.max(y_max, ...series.map(([x, y]) => y));
		}
		this.chart.classList.add('bwp-linechart');
		const [x_axis, y_axis, diff_x, diff_y] = this.makeScaledChart(y_min, y_max, x_min, x_max);
		// Lines
		let legend_offset = 0;
		for (let i = 0; i < values.length; i++) {
			let g = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-chart-serie']);
			g.appendChild(this.makePathOfSerie(values[i],colors[i],x_axis,diff_x,y_axis,diff_y));
			g.appendChild(this.makeTextOfSerie(values[i],x_axis,diff_x,y_axis,diff_y));
			if (this.config.legend)
				legend_offset = this.createLegendItem(g, legends[i], colors[i], this.config.xWidth + 20, -this.config.yWidth, legend_offset);
			this.chart.appendChild(g);
		}
	}
	getPoint(value, min, diff) { return round((value-min)*diff); }
	makePathOfSerie(serie, color, x_min, x_diff, y_min, y_diff) {
		let d = `M ${this.getPoint(serie[0][0],x_min,x_diff)+5} ${-this.getPoint(serie[0][1],y_min,y_diff)} `;
		for (let i = 1; i < serie.length; i++) {
			d += `L ${this.getPoint(serie[i][0],x_min,x_diff)+5} ${-this.getPoint(serie[i][1],y_min,y_diff)} `;
		}
		return this.createSVGPath(d, '', [color, 'bwp-chart-serie-line']);
	}
	makeTextOfSerie(serie, x_min, x_diff, y_min, y_diff) {
		let g = createElement(["http://www.w3.org/2000/svg", "g"],['bwp-chart-serie-labels']);
		for (let pair of serie) {
			g.appendChild(this.createSVGText(this.getPoint(pair[0],x_min,x_diff)+5, -this.getPoint(pair[1],y_min,y_diff), round(pair[1],1), ['bwp-chart-serie-label']));
		}
		return g;
	}
}

function L_watchDOMManipulations() {
	const observer = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (!(node instanceof HTMLElement)) continue;
				const widgetMap = {
					'.bwp-chart[data-bwp-type=piechart]': BWP_PieChart,
					'.bwp-chart[data-bwp-type=columnchart]': BWP_ColumnChart,
					'.bwp-chart[data-bwp-type=linechart]': BWP_LineChart,
				};
				for (const [selector, Widget] of Object.entries(widgetMap)) {
					const target = node.matches(selector) ? node : node.querySelector(selector);
					if (target) {
						new Widget(target);
					}
				}
			}
		}
	});
	observer.observe(document.body, { childList: true, subtree: true });
}

function runChartApi() {
	document.querySelectorAll(".bwp-chart[data-bwp-type]").forEach(el => {
		switch (el.dataset.bwpType) {
			case "piechart": new BWP_PieChart(el); break;
			case "columnchart": new BWP_ColumnChart(el); break;
			case "linechart": new BWP_LineChart(el); break;
			default: console.warn("Unknown chart type:", el.dataset.bwpType);
		}
	});
	L_watchDOMManipulations();
}

runChartApi();
