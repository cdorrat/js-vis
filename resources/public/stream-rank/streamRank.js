/** A variation of a stream graph that emphasises rank.
 * based on the charts from http://www.xach.com/moviecharts/
 * 
 * This chart is basically a stacked bar chart with the series sorted by percentage of the bar 
 * and lines drawn between the same series in adjacent bars.
 * Unlike normal stream graphs new series can be started/terminted at any point in the series.
 * 
 * Accepts the following parameters:
 *   - padding    - a map of {left: x, right: y, top: n, bottom: m}
 *   - width      - width of the svg element in pixels
 *   - height     - height of the svg element in pixels
 *   - idFn       - a function that given a data element returns the id for that series, defaults to d.name
 *   - periodFn   - a function that given a data element returns the label for the x axis defaults to d.x
 *   - colorScale - a function that given the id for a series returns a color, defaults to d3.scale.category20
 * 
 * Data Requirements:
 * 
 **/

function streamRank() {
  // properties that can be set  
  var padding = {left: 50, right: 50, top: 20, bottom: 20};
  var width = 700;
  var height = 400;

  var detailsData = {
    'Mary': {'name':'Mary','totalVal':400},
    'Joanna': {'name':'Joanna','totalVal':750},
    'Harry': {'name':'Harry','totalVal':480},
    'Fred': {'name':'Fred','totalVal':390}    
  };

  var idFn = function(d) {return d.name;};
  var periodFn = function(d) { return d.x;};

  var colorScale;

  function chart(selection) {
    selection.each(
      function (dataset) {		     		   

	var xScale = d3.scale.ordinal()
	  .domain(d3.range(0, dataset.length * 2 -1))
	  .rangeRoundBands([padding.left, width - padding.right]);

	var yScale =  d3.scale.linear()
	  .domain([0, 1])
	  .rangeRound([height - padding.bottom, padding.top]);

	if (! colorScale) {
	  colorScale = createColorScale(dataset);
	}

	var x = function(d) {return xScale(d.periodIdx * 2) -1;};
	var y = function(d) {return yScale(d.pcntMax);};

 	var svg = d3.select(this)
 	  .append("svg")
 	  .attr("width", width)
 	  .attr("height", height);

	addDetailsTable(d3.select(this));

	svg.append("rect")
	.attr("x", 0)
	.attr("y", 0)
	.attr("width", width)
	.attr("height", height)
	.attr("fill", "white");

	// add a rect for each value in each timestep
	svg.selectAll("g")
	  .data(dataset)
	  .enter()
	  .append("g")
	  .selectAll("rect")
	  .data(function(d) {return d;})
	  .enter()
          .append("rect")
	  .attr("x", x)
	  .attr("y", y)
	  .attr("width", xScale.rangeBand() +2)
	  .attr("height", function (d) {return yScale(d.pcntMin) - yScale(d.pcntMax);})
	  .attr("class", "streamBox")
	  .attr("rank", function (d) {return d.rank;} )
	  .attr("fill", function(d) {return colorScale(idFn(d));});

	// provide links from a box to its predecessor in the previous time period (if any)
	svg.selectAll("g")
	  .data(dataset)
	  .selectAll("path")
	  .data(function(d) {return d;})
	  .enter()
          .append("path")
	  .attr("d", linkPathDAttr)
	  .attr("class", "streamBox")
	  .attr("fill",  function(d) {return colorScale(idFn(d));});

	// create an initially invisible path that covers all values for a given id
	// on mouseover we'll use this to hightlight an entry	
	var pathMouseoverFn = function(d) {
	  svg.selectAll(".streamBox").attr("class", "backgroundPath");
	  updateDetailsOnMouseOver(detailsData[idFn(d)]);
	  var path = d3.select(this);
          path.attr("class", "highlightedPath");
	};

	var pathMouseoutFn = function() {
	  svg.selectAll(".backgroundPath").attr("class", "streamBox");
	  var path = d3.select(this);
	  if (path.attr("class") === "highlightedPath") {
	    path.attr("class", "idPath");	   
	  }
	};

	var onClickFn = function() {
	  var path = d3.select(this);
	  path.attr("class", (path.attr("class") === "selectedPath") ? "highlightedPath" : "selectedPath");
	};

	var surroundingPaths = createIdPaths(dataset);
	
	svg.append("g")
	  .selectAll("path")
	  .data(surroundingPaths)
	  .enter()
	  .append("path")
	  .attr("d", function (d) {return d.d;})
	  .attr("id", function (d) {return d.name;})
	  .attr("class", "idPath")	  
	  .attr("fill",  function(d) { return colorScale(d.name);})
	  .on("mouseover", pathMouseoverFn)
	  .on("mouseout", pathMouseoutFn)
	  .on("click", onClickFn);
	
	// add x labels
	svg.append("g")
	  .selectAll("text")
	  .data(dataset)
	  .enter()
	  .append("text")
	  .text(function (d) {return periodFn(d[0]);})
	  .attr("x", function (d) {
		  return x(d[0]) + xScale.rangeBand() * 0.4;})
	  .attr("y", height - 1)
	  .attr("text-anchor", "middle")
	  .attr("class", "xAxis");


	// ===============================================================================
	// detials table code
	function addDetailsTable(parent) {	  
	  var table = parent.append("table")
	             .attr("class", "detailsTable");

	  var cols = ["Name", "-", "val"];

	  // add acolumn for each field
	  table.append("tr")
	  .selectAll("th")
	  .data(cols)
	  .enter()
	  .append("th")
	  .text(function(d) {return d;});	  	  
	  
	  table.append("tr")
	    .attr("class", "currDetails")
	    .selectAll("td")
	    .data(cols)
	    .enter()
	    .append("td");
	}		

	function updateDetailsOnMouseOver(d) {
	  var selectedVals = [d.name, "", d.totalVal];
	  d3.selectAll(".currDetails td")
	    .data(selectedVals)
	    .text(function (d) {return d;});
	}

	// ===============================================================================
	
	// calculate the svg path D attribute for a link between the current block
	// and its previous values (if any)
	function linkPathDAttr(d) {
	  var p = calcLinkPoints(d);

	  var val = "M" + p.x1 +"," + p.y2 + "\n";
	  if (p.midX) {	
	    val += "C" + p.midX + "," + p.y2 + "," + p.midX + "," + p.y0 + "," + p.x0 + "," + p.y0 +  "\n";
	    val += "L" + p.x0 + "," + p.y1;
	    val += "C" + p.midX + "," + p.y1 + "," + p.midX + "," + p.y3 + ","  + p.x1  + "," + p.y3 + "\n";
	    val += "Z";
	  }
	  return val;
	}

	// create an svg path D attribute for each unique id in our dataset & return as an associative array
	function createIdPaths(dataset) {
	  var allPaths = {};

          // d3's path support didnt seem to be a good fit here so we'll manually construct the svg paths
	  // that completly describe each series in the data
	  var idx = -1;
	  for (period in dataset) {
	    ++idx;
	    for (val in dataset[period]) {
	      var d = dataset[period][val];
	      var p = calcLinkPoints(d, idx);
	      var path = allPaths[idFn(d)];
	      if (! path) {
		// first time we've seen this series, draw top & bottom lines on the box
		allPaths[idFn(d)] = {
		  'path': ["M" + p.x1 + "," + p.y2 + "\n", 
			   "l" + xScale.rangeBand() + ",0\n"],
		  'retPath': ["Z", 
			      "L" + p.x1 + "," + p.y3 + "\n"],
		  'lastPt': d,
		  'x0' : p.x1,
		  'y0' : p.y2,
		  'y1' : p.y3
		};
		
	      }	else {
		// bezier from prev
		path.path.push("C" + p.midX + "," + p.y0 + "," + p.midX + "," + p.y2 + "," + p.x1 + "," + p.y2 +  "\n");
		path.path.push("l" + xScale.rangeBand() + ",0\n");
		
		path.retPath.push("C" + p.midX + "," + p.y3+ "," + p.midX + "," + p.y1+ ","  + p.x0 + "," + p.y1+ "\n");
		path.retPath.push("L" + p.x1 + "," + p.y3 + "\n");

		path.lastPt = d;
	      }
	    }
	  }

	  // join up the 2 halves & return a map of id -> path
	  var retVal = [];
	  for(id in allPaths) {
	    var path = allPaths[id];
	    var d = "";
	    for(s in path.path) {
	      d += path.path[s];
	    }
	    d += "l0," + (yScale(path.lastPt.pcntMin) - yScale(path.lastPt.pcntMax)) + "\n";
	    
	    while(path.retPath.length > 0) {
	      d += path.retPath.pop();
	    }
	    retVal.push({'name' : id, 
			 'd' : d,
			 'x0': path.x0,
			 'y0': path.y0,
			 'y1': path.y1
			});
	  }
	  return retVal;
	}

	// Calculate the points for the join between 2 blocks
	// [x1, y2] is the top left of the current block
	// [x1, y3] is the bottom left of the current block
	// [x0, y0] is the top right of the previous box
	// [x0, y1] is the bottom right of the previous box
	// midX is the x point halfway betweeen the boxes
	function calcLinkPoints(d, i) {
	  var y2 = yScale(d.pcntMax);
	  var idx = i ? i : d.periodIdx;
	  var points = {'x1': xScale(idx * 2),// +1,
		        'y2': y2,
			'y3': y2 + yScale(d.pcntMin) - yScale(d.pcntMax)};
	  
	  if (d.prevPcntMax) {
            points['x0'] = xScale((idx - 1) * 2) + xScale.rangeBand();// - 1;
	    points['y0'] = yScale(d.prevPcntMax);
	    points['y1'] = points.y0 + yScale(d.prevPcntMin) - yScale(d.prevPcntMax);
	    	    
	    points['midX'] = points.x0 + (points.x1 - points.x0) * 0.5;
	    
	  }
	  return points;
	}
      });    

    // return a function that given a data object returns a color
    function createColorScale(dataset) {
      var colorIndexes = {};
      var idx = 0;
      for (period in dataset) {
	for (val in dataset[period]) {
	  var id = idFn(dataset[period][val]);
	  if (! colorIndexes.hasOwnProperty(id)) {
	    colorIndexes[id] = idx++;  
	  }	  
	}
      }      

      var d3Colors = d3.scale.category20();

      return function(id) {
	return d3Colors(colorIndexes[id]);
      };      
    }
  }


  // property accessors
  chart.padding = function(_) {
    if (!arguments.length) return padding;

    for (prop in _) { 
      padding[prop] = _[prop];
    }
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.idFn = function(_) {
     if (!arguments.length) return idFn;
     idFn = _;
     return chart;
  };
  
  chart.periodFn = function(_) {
  	  
     if (!arguments.length) return periodFn;
     periodFn = _;
     return chart;
  };
  
  chart.colorScale = function(_) {      
     if (!arguments.length) return colorScale;
     colorScale = _;
     return chart;
  };
  
    
  return chart;
}


/**
 * A helper function to convert data to a format suitable for use with the streamRank chart.
 */
function streamRankLayout() {
  var valueFn = function(d) {return d.val;};
  var periodFn = function(d) { return d.x;};
  var idFn = function(d) {return d.name;};


  function entries(data) {

    // group our data by time period & sort each period by the valuFn    
    var groupedData = d3.nest()
      .key(periodFn)
      .sortKeys(d3.ascending)
      .sortValues(function(ao, bo){
		    var a = valueFn(ao), b = valueFn(bo);
		    return a < b ? -1 : a > b ? 1 : 0;})
      .entries(data)
      .map(function(d) {return d.values;});

    // grab the min, max and sum values for each time period
    var extents = groupedData.map(function(d) {
				    return {min: valueFn(d[0]), 
					    max: valueFn(d[d.length - 1]), 
					    sum: d3.sum(d, valueFn)};});

    var globalMax = d3.max(extents, function (d) {return d.sum;});

    // add percentages telling us how what percentage of the height to use & location in the stack
    var prevVals = {};
    for(var period = 0; period <  groupedData.length; ++period) {
      var startPcnt = (1 - extents[period].sum / globalMax) / 2;
      var numSeriesInPeriod = groupedData[period].length;
      for(var i=0; i < numSeriesInPeriod; ++i) {
	var o = Object.create(groupedData[period][i]);
	var objId = idFn(o);

	var maxPcnt = startPcnt + valueFn(o) / globalMax;
	o.pcntMin = startPcnt;
	o.pcntMax = maxPcnt;
	o.rank = numSeriesInPeriod - i;

	var prev = prevVals[objId];
	if (prev) {
	  o.prevPcntMin = prev.pcntMin;
	  o.prevPcntMax = prev.pcntMax;
	  o.prevRank = prev.rank;
	  o.periodIdx = period;
	}

	groupedData[period][i] = o;
	prevVals[objId] = o;
	startPcnt = maxPcnt;			
      }
    }

    return groupedData;    
  }

  entries.valueFn = function(_) {
    if (!arguments.length) return valueFn;
    valueFn = _;
    return entries;
  };

  entries.periodFn = function(_) {
    if (!arguments.length) return periodFn;
    periodFn = _;
    return entries;
  };

  entries.idFn = function(_) {
    if (!arguments.length) return idFn;
    idFn = _;
    return entries;
  };

  return entries;

}