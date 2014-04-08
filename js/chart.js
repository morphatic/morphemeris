// globals
var Planet, Aspect,
	cmap = { "sun": 'a', "moon": 's', "mercury": 'd', "venus": 'f', "mars": 'h', "jupiter": 'j',
			 "saturn": 'k', "uranus": 'ö', "neptune": 'ä', "pluto": '#', "south node": '?', "north node": 'ß',
			 "ceres": 'A', "pallas": 'S', "juno": 'D', "vesta": 'F', "lilith": 'ç', "cupido": 'L', "chiron": 'l',
			 "nessus": 'ò', "pholus": 'ñ', "chariklo": 'î', "aries": 'q', "taurus": 'w', "gemini": 'e', "cancer": 'r',
			 "leo": 't', "virgo": 'z', "libra": 'u', "scorpio": 'i', "sagittarius": 'o', "capricorn": 'p',
			 "aquarius": 'ü', "pisces": '+', "conjunct": '<', "semisextile": 'y', "semisquare": '=', "sextile": 'x',
			 "quintile": 'Y', "square": 'c', "trine": 'Q', "sesquiquadrate": 'b', "biquintile": 'C', "inconjunct": 'n',
			 "opposition": 'm',"eris": 'È', "chaos": 'Ê' }; // mapping of objects to the characters that represent them

// define the planet object
Planet = function( index, name, lon, retro, x, y ) {
	this.index   = index; // for d3.force
	this.fixed   = false; // for d3.force
	this.weight  = 1;     // for d3.force
	this.name    = name;
	this.lon     = lon;   // longitude; should we correct this here or somewhere else?
	this.retro   = retro; // is it retrograde?
	this.x       = x;     // the x coord on the chart
	this.y       = y;     // the y coord on the chart
	this.aspects = { conjunct: [], semisextile: [], semisquare: [], sextile: [],
					 quintile: [], square: [], trine: [], sesquiquadrate: [],
					 biquintile: [], inconjunct: [], opposition: [] };
};

Planet.prototype.addAspect = function( aspect ) {
	this.aspects[ aspect.type ].push( aspect );
};

Planet.prototype.isRetrograde = function() {
	return 1 == this.retro;
};

// define the aspect class; constructor takes two planet objects
Aspect = function( p1, p2 ) {

	// get the longitudes and then calculate the angle between them
	var l1  = +p1.lon,
		l2  = +p2.lon,
		ang = Math.abs( l1 - l2 ),
		r1  = p1.isRetrograde(),
		r2  = p2.isRetrograde(),
		s1  = +p1.spd,
		s2  = +p2.spd;

	// correct for cases when the angle > 186
	if ( ang > 186 ) ang = l1 > l2 ? 360 - l1 + l2 : 360 - l2 + l1;

	// identify and set relationship type
	if      ( ang <=   6 )               { this.type = 'conjunct';       } //   0 +/- 6
	else if ( ang >=  27 && ang <=  33 ) { this.type = 'semisextile';    } //  30 +/- 3
	else if ( ang >=  42 && ang <=  48 ) { this.type = 'semisquare';     } //  45 +/- 3
	else if ( ang >=  54 && ang <=  66 ) { this.type = 'sextile';        } //  60 +/- 6
	else if ( ang >=  70 && ang <=  74 ) { this.type = 'quintile';       } //  72 +/- 2
	else if ( ang >=  84 && ang <=  96 ) { this.type = 'square';         } //  90 +/- 6
	else if ( ang >= 114 && ang <= 126 ) { this.type = 'trine';          } // 120 +/- 6
	else if ( ang >= 132 && ang <= 138 ) { this.type = 'sesquiquadrate'; } // 135 +/- 3
	else if ( ang >= 142 && ang <= 146 ) { this.type = 'biquintile';     } // 144 +/- 2
	else if ( ang >= 147 && ang <= 153 ) { this.type = 'inconjunct';     } // 150 +/- 3
	else if ( ang >= 174 && ang <= 186 ) { this.type = 'opposition';     } // 180 +/- 6
	else {
		// there was no aspect between these two planets
		this.type = null;
		return;
	}

	this.planet1  = p1;    // planet associated with this aspect
	this.planet2  = p2;    // planet associated with this aspect
	this.degrees  = ang;   // degrees separating the two planets
	this.applying = false; // is it applying or separating? default separating

	if (
		// both direct AND planet with lower longitude has greater speed
		( ( !r1 && !r2 ) && ( ( s1 > s2 && l1 < l2 ) || ( s2 > s1 && l2 < l1 ) ) ) ||
		// both retrograde AND planet with greater longitude has greater speed
		( ( r1  &&  r2 ) && ( ( s1 > s2 && l1 > l2 ) || ( s2 > s1 && l2 > l1 ) ) ) ||
		// p1 retro, p2 direct; p1 longitude greater than p2 longitude
		( ( r1  && !r2 ) && ( l1 > l2 ) ) ||
		// p1 direct, p2 retro; p2 longitude greater than p2 longitude
		( ( !r1 &&  r2 ) && ( l2 > l1 ) )
	) this.applying = true; // it is applying
};

Aspect.prototype.getCoords = function() {
	return {
		x1: this.planet1.x,
		x2: this.planet2.x,
		y1: this.planet1.y,
		y2: this.planet2.y
	};
};

$(function(){
	var morgan = { lat: 37.413611, lon:  -79.1425,  date: '2/18/1974 12:30 AM', tz: 'UTC' },
		nicole = { lat: 35.216667, lon:  -80.85,    date: '4/25/1976  1:02 PM', tz: 'UTC' },
		nozomi = { lat: 43.483333, lon: 142.08333,  date: '7/30/1973  2:57 PM', tz: 'UTC' },
		melvin = { lat: 38.857985, lon: -77.227071, date: '1/06/1994  6:00 AM', tz: 'America/New_York' },
		width  = 700,
		height = 700,
		planets = [],
		aspects = [],
		ascendant,
		outerRadius = Math.min( width, height ) / 2,
		innerRadius = outerRadius - 50,
		crt    = d3.select( '#chart' ).append( 'svg' ).attr( 'width', width ).attr( 'height', height ),
		svg    = crt.append( 'g' ).attr( "transform", "translate(" + width / 2 + "," + height / 2 + ")" ),

		getAspect;


	// add the horizon
	crt.append( 'line' ).attr( 'x1', 0 ).attr( 'x2', width ).attr( 'y1', height / 2 ).attr( 'y2', height / 2 ).attr( 'stroke', '#666' ).attr( 'stroke-width', 2 );

	// props: http://stackoverflow.com/questions/19792552/d3-put-arc-labels-in-a-pie-chart-if-there-is-enough-space
	drawArc     = function( svg, inRad, outRad, rot, data, dFunc, tFunc, gclass, fmt ) {
		// initializations
		var pie = d3.layout.pie().sort( null ).value( dFunc ),
			arc = d3.svg.arc().innerRadius( inRad ).outerRadius( outRad ),
			fmt = 'undefined' != typeof fmt ? fmt : { stroke: '#999', stroke_width: 1, fill: 'transparent' },
			tfx = function( d ) { return 'translate( ' + arc.centroid( d ) + ') rotate( ' + (-rot) + ', 0, 0 )'; },
			sfc = function( d ) { return d.visible ? null : null; },
			g   = svg.selectAll( '.' + gclass ).data( pie( data ) ).enter().append( 'g' ).attr( 'class', gclass ).attr( 'transform', 'rotate( ' + rot + ', 0, 0 )'),
			isPtInArc, labelArc;

			isPtInArc   = function( pt, ptData, d3arc ) {
			    var r1     = arc.innerRadius()( ptData ),
			        r2     = arc.outerRadius()( ptData ),
			        theta1 = arc.startAngle()(  ptData ),
			        theta2 = arc.endAngle()(    ptData ),
					dist   = pt.x * pt.x + pt.y * pt.y,
			        angle  = Math.atan2( pt.x, -pt.y );
			    angle = ( angle < 0 ) ? ( angle + Math.PI * 2 ) : angle;
			    return ( r1 * r1 <= dist ) && ( dist <= r2 * r2 ) && ( theta1 <= angle ) && ( angle <= theta2 );
			};
			labelArc    = function( d ) {
				var bb          = this.getBBox(),
					center      = arc.centroid(d),
					topLeft     = { x : center[0] + bb.x,     y : center[1] + bb.y      },
					topRight    = { x : topLeft.x + bb.width, y : topLeft.y             },
					bottomLeft  = { x : topLeft.x,            y : topLeft.y + bb.height },
					bottomRight = { x : topLeft.x + bb.width, y : topLeft.y + bb.height };
				d.visible = isPtInArc( topLeft,    d, arc ) && isPtInArc( topRight,    d, arc ) &&
							isPtInArc( bottomLeft, d, arc ) && isPtInArc( bottomRight, d, arc );
			};

		g.append( 'path' ).attr( 'd', arc ).attr( 'fill', fmt.fill ).attr( 'stroke', fmt.stroke ).attr( 'stroke-width', fmt.stroke_width );
		g.append( 'text' ).attr( 'transform', tfx ).attr( 'dy', '.35em' ).style( 'text-anchor', 'middle' ).text( tFunc ).each( labelArc ).style( 'display', sfc );
	};
	drawSpoke   = function( angle, r1, r2, g, scol, swid, ex ) {
		var rd = angle * Math.PI / 180,
			ex = 'undefined' != typeof ex ? ex : 0,
			x1 = r1 * Math.cos( rd ),
			y1 = r1 * Math.sin( rd ),
			x2 = ( r2 + ex ) * Math.cos( rd ),
			y2 = ( r2 + ex ) * Math.sin( rd );
		g.append( 'line' ).attr( 'x1', x1 ).attr( 'x2', x2 ).attr( 'y1', y1 ).attr( 'y2', y2 ).attr( 'stroke', scol ).attr( 'stroke-width', swid );
	};
	drawHouses  = function( houses ) {
		// variable declarations
		var r1 = outerRadius,
			r2 = innerRadius,
			tr = r2 + 5, // tick radius
			h1 = 40, // inner radius for houses arc
			h2 = 75, // outer radius for houses arc
			tg = svg.append( 'g' ),
			hg = svg.append( 'g' ),
			hd = [], rotation, weight, color, ang, next, i, hang = 0, signs;

		// initializations/assignments
		rotation  = ascendant - 90;
		zodiac    = [
			{ v: 1, s: cmap[ 'pisces'      ] },
			{ v: 1, s: cmap[ 'aquarius'    ] },
			{ v: 1, s: cmap[ 'capricorn'   ] },
			{ v: 1, s: cmap[ 'sagittarius' ] },
			{ v: 1, s: cmap[ 'scorpio'     ] },
			{ v: 1, s: cmap[ 'libra'       ] },
			{ v: 1, s: cmap[ 'virgo'       ] },
			{ v: 1, s: cmap[ 'leo'         ] },
			{ v: 1, s: cmap[ 'cancer'      ] },
			{ v: 1, s: cmap[ 'gemini'      ] },
			{ v: 1, s: cmap[ 'taurus'      ] },
			{ v: 1, s: cmap[ 'aries'       ] }
		];

		// draw the ticks around the zodiac and rotate them appropriately
		for ( i = 0; i < 360; i++ ) {
			if      ( 0 == i % 10 ) drawSpoke( i, r2, tr, tg, '#999', 1, 10 );
			else if ( 0 == i %  5 ) drawSpoke( i, r2, tr, tg, '#999', 1,  5 );
			else				    drawSpoke( i, r2, tr, tg, '#999', 1,  0 );
		}
		tg.attr( 'transform', 'rotate( ' + rotation + ' )' );

		// draw spokes for the houses
		for ( i = 11; i >= 0; i-- ) {
			next = 11 == i ? 0 : i + 1;
			if ( houses[ next ] > houses[ i ] ) {
				ang = houses[ next ] - houses[ i ];
			} else {
				ang = 360 - houses[ i ] + houses[ next ];
			}
			hd.push( ang );
			hang += ang;
			weight = ( i == 9 || i == 3 ) ? 2 : 1;
			color  = ( i == 9 || i == 3 ) ? '#666' : '#999';
			drawSpoke( hang, h1, r2, hg, color, weight );
		};

		// draw the zodiac
		drawArc( svg, r1, r2, rotation, zodiac, function( d ) { return +d.v; }, function( d ) { return d.data.s; }, 'zarc' );

		// draw the houses
		drawArc( svg, h1, h2, -90, hd, function( d ) { return d; }, function( d, i ) { return 12 - i; }, 'harc' );
	};
	drawPlanets = function() {
		var r1 = innerRadius, r2 = r1 - 30, x, y, t, nodes = planets, g,
			force = d3.layout.force().nodes( nodes ).charge( -1000 ).size( [ width, height ] ).start();

		g = svg.append( 'g' ).attr( 'class', 'planets' );
		g.selectAll( 'text' )
		 .data( nodes.slice( 1 ) )
		 .enter().append( 'text' )
		 .attr( 'x', function( d ) { return r2 * Math.cos( d.lon * Math.PI / 180 ); } )
		 .attr( 'y', function( d ) { return r2 * Math.sin( d.lon * Math.PI / 180 ); } )
		 .attr( 'dx', '0' )
		 .attr( 'dy', '10px' )
		 .text( function( d ) { return cmap[ d.name ]; } )
		 .attr( 'class', 'planet' )
		 .style( 'font-size', '1.5em' )
		 .style( 'text-anchor', 'middle' );
		console.log( nodes );
		force.resume();
		/*
		$( planets ).each( function( i, p ) {
			var g = svg.append( 'g' );
			g.attr( 'class', p.name );
			drawSpoke( p.lon, r1, r2, g, '#999', 1,  0 );
			rads = p.lon * Math.PI / 180;
			x = r2 * Math.cos( rads );
			y = r2 * Math.sin( rads );
			t = g.append( 'text' )
				.attr( 'x', x )
				.attr( 'y', y )
				.attr( 'dx', '0' )
				.attr( 'dy', '10px' )
				.text( cmap[ p.name ] )
				.attr( 'class', 'planet' )
				.style( 'font-size', '1.5em')
				.style( 'text-anchor', 'middle' );
			if ( 1 == p.r ) {
				t.append( 'tspan' ).attr( 'dy', '-1em' ).attr( 'font-size', '0.5em' ).text( ' ®' );
			}
			fi = i + planets.length;
			fx = r1 * Math.cos( rads );
			fy = r2 * Math.cos( rads );
			fixed  = { index: fi, x: fx, y: fy, fixed: true,  weight: 1 };
			moving = { index:  i, x:  x, y:  y, fixed: false, weight: 1, tnode: t };
			//console.log( t[ 0 ] );
			nodes[  i ] = moving;
			nodes[ fi ] = fixed;
			links.push( { source: nodes[ fi ], target: nodes[ i ] } );
		})
		.promise().done( function() { console.log( links ); force.resume(); } );
		*/
	};
	drawAspects = function() {
		var g = svg.append( 'g' ).attr( 'class', 'aspects' );
		$.each( aspects, function( i, aspect ) {
			if ( aspect.type != 'conjunct' ) {
				var c = aspect.getCoords();
				g.append( 'line' )
				 .attr( 'x1', c.x1 )
				 .attr( 'x2', c.x2 )
				 .attr( 'y1', c.y1 )
				 .attr( 'y2', c.y2 )
				 .attr( 'class', aspect.type + ' ' + aspect.planet1.name + ' ' + aspect.planet2.name )
				 .attr( 'stroke', '#999' )
				 .attr( 'stroke-width', 1 );
			}
		});
	};
	drawChart   = function( person ) {
		$.get( 'ephemeris.php', person ).done( function( cdata ) {

			// set the ascendant for this chart
			ascendant = +cdata.ascendant;

			// draw the houses
			drawHouses( cdata.houses );

			// loop through the planets and add them to the global list
			var i = 0;
			$.each( cdata.planets, function( pname, p ) {
				// get the longitude for the chart and the xy coords
				var lon = 180 + ascendant - +p.lon,      // longitude for the chart: TEST THIS THOROUGHLY
					rad = lon * Math.PI / 180,           // radians of the longitude
					x   = innerRadius * Math.cos( rad ), // x coord on the chart
					y   = innerRadius * Math.sin( rad ); // y coord on the chart
				// add it to the global list of planets
				planets.push( new Planet( i, pname, lon, +p.r, x, y ) );
				i++;
			});

			// loop through the planets and determine their aspects
			$.each( planets, function( i, p1 ) {
				$.each( planets, function( j, p2 ) {
					if ( i != j && j > i ) {
						var aspect = new Aspect( p1, p2 );
						if ( aspect.type !== null ) {
							p1.addAspect( aspect );
							p2.addAspect( aspect );
							aspects.push( aspect );
						}
					}
				});
			});

			// draw the aspects
			drawAspects();

			// draw the planets
			drawPlanets();

			// create toggles for planets and aspects in the control panel
			$.each( planets, function( i, p ) {
				$( '#planets_tab ul' ).append( '<li><label><input type="checkbox" checked name="' + p.name + '">' + p.name + '</label></li>' );
			});
			$( '#planets_tab input[type="checkbox"]' ).on( 'change', function( e ) {
				if ( this.checked ) {
					$( '.' + this.name + ' text, .' + this.name ).fadeIn();
				} else {
					$( '.' + this.name + ' text, .' + this.name ).fadeOut();
				}
			});
			$( '#aspects_tab input[type="checkbox"]' ).on( 'change', function( e ) {
				if ( this.checked ) {
					$( 'line.' + this.name ).fadeIn().attr( 'class', function( i, c ) { return c.replace( 'hidden', '' ); } );
				} else {
					$( 'line.' + this.name ).fadeOut( { complete: function() {
						$( 'line.' + this.name ).attr( 'class', function( i, c ) { return c + ' hidden'; } );
					}});
				}
			});
			$( '#all_aspects' ).button().on( 'click', function() { $( '#aspects_tab input[type="checkbox"]:not(:checked)' ).prop( 'checked', true  ).trigger( 'change' ); } );
			$( '#no_aspects'  ).button().on( 'click', function() { $( '#aspects_tab input[type="checkbox"]:checked'       ).prop( 'checked', false ).trigger( 'change' ); } );
		});
	};

	$( '#panel' ).tabs();
	drawChart( nicole );
});
