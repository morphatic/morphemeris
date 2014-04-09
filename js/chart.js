//(function() {
	'use strict';

	var Planet, // class for representing planets
		Aspect, // class for representing planets
		Chart,  // class for drawing charts
		// mapping of planets, signs, aspects, etc. to the Kairon Semiserif font
		cmap = {
			"sun":            'a',
			"moon":           's',
			"mercury":        'd',
			"venus":          'f',
			"earth":          'g',
			"mars":           'h',
			"jupiter":        'j',
			"saturn":         'k',
			"uranus":         'ö',
			"neptune":        'ä',
			"pluto":          '#',
			"south node":     '?',
			"north node":     'ß',
			"ceres":          'A',
			"pallas":         'S',
			"juno":           'D',
			"vesta":          'F',
			"lilith":         'ç',
			"cupido":         'L',
			"chiron":         'l',
			"nessus":         'ò',
			"pholus":         'ñ',
			"chariklo":       'î',
			"eris":           'È',
			"chaos":          'Ê',
			"fortuna":        '%',
			"retrograde":     '®',
			"aries":          'q',
			"taurus":         'w',
			"gemini":         'e',
			"cancer":         'r',
			"leo":            't',
			"virgo":          'z',
			"libra":          'u',
			"scorpio":        'i',
			"sagittarius":    'o',
			"capricorn":      'p',
			"aquarius":       'ü',
			"pisces":         '+',
			"conjunct":       '<',
			"semisextile":    'y',
			"decile":         '>',
			"novile":         'M',
			"semisquare":     '=',
			"septile":        'V',
			"sextile":        'x',
			"quintile":       'Y',
			"bilin":          '-',
			"binovile":       ';',
			"square":         'c',
			"biseptile":      'N',
			"tredecile":      'X',
			"trine":          'Q',
			"sesquiquadrate": 'b',
			"biquintile":     'C',
			"inconjunct":     'n',
			"treseptile":     'B',
			"tetranovile":    ':',
			"tao":            '—',
			"opposition":     'm',
			"parallel":       'O',
			"contraparallel": 'P',
			"degrees":        '°',
			"minutes":        '`',
			"seconds":        '"'
		},
		// object to hold aspects, angles, and orbs
		amap = {
			conjunct:       { angle:   0,     orb: 6   },
			semisextile:    { angle:  30,     orb: 3   },
			decile:         { angle:  36,     orb: 1.5 },
			novile:         { angle:  40,     orb: 1.9 },
			semisquare:     { angle:  45,     orb: 3   },
			septile:        { angle:  51.417, orb: 2   },
			sextile:        { angle:  60,     orb: 6   },
			quintile:       { angle:  72,     orb: 2   },
			bilin:          { angle:  75,     orb: 0.9 },
			binovile:       { angle:  80,     orb: 2   },
			square:         { angle:  90,     orb: 6   },
			biseptile:      { angle: 102.851, orb: 2   },
			tredecile:      { angle: 108,     orb: 2   },
			trine:          { angle: 120,     orb: 6   },
			sesquiquadrate: { angle: 135,     orb: 3   },
			biquintile:     { angle: 144,     orb: 2   },
			inconjunct:     { angle: 150,     orb: 3   },
			treseptile:     { angle: 154.284, orb: 1.1 },
			tetranovile:    { angle: 160,     orb: 3   },
			tao:            { angle: 165,     orb: 1.5 },
			opposition:     { angle: 180,     orb: 6   }
		};

	// define the planet object and functions
	Planet = function( name, lon, retro, x, y ) {
		this.fixed   = false; // for d3.force
		this.weight  = 1;     // for d3.force
		this.radius  = 15;    // for d3.force
		this.name    = name;
		this.lon     = lon;   // longitude; should we correct this here or somewhere else?
		this.retro   = retro; // is it retrograde?
		this.x       = x;     // the x coord on the chart
		this.y       = y;     // the y coord on the chart
		this.power   = 0;	 // will hold the power, once calculated
		this.aspects = {};
		// initialize aspect arrays
		var self = this;
		$.each( amap, function( name ) { self.aspects[ name ] = []; } );
	};

	Planet.prototype.addAspect = function( aspect ) {
		this.aspects[ aspect.type ].push( aspect );
	};

	Planet.prototype.isRetrograde = function() {
		return 1 === this.retro;
	};

	// define the aspect class; constructor takes two planet objects
	Aspect = function( p1, p2 ) {

		// get the longitudes and then calculate the angle between them
		var l1   = +p1.lon,
			l2   = +p2.lon,
			ang  = Math.abs( l1 - l2 ),
			r1   = p1.isRetrograde(),
			r2   = p2.isRetrograde(),
			s1   = +p1.spd,
			s2   = +p2.spd
			self = this;

		// correct for cases when the angle > 180 + the orb of opposition
		if ( ang > 180 + amap.opposition.orb ) { ang = l1 > l2 ? 360 - l1 + l2 : 360 - l2 + l1; }

		// initialize the aspect type, and determine if one exists
		this.type = null;
		$.each( amap, function( name, asp ) {
			if ( ang >= asp.angle - asp.orb && ang <= asp.angle + asp.orb ) {
				self.type = name; return false;
			}
		});
		if ( null === this.type ) { return; }  // abort if no aspect!

		this.planet1  = p1;    // planet associated with this aspect
		this.planet2  = p2;    // planet associated with this aspect
		this.degrees  = ang;   // degrees separating the two planets
		this.applying = false; // is it applying or separating? default separating

		// determine if it's applying or not
		if (
			// both direct AND planet with lower longitude has greater speed
			( ( !r1 && !r2 ) && ( ( s1 > s2 && l1 < l2 ) || ( s2 > s1 && l2 < l1 ) ) ) ||
			// both retrograde AND planet with greater longitude has greater speed
			( ( r1  &&  r2 ) && ( ( s1 > s2 && l1 > l2 ) || ( s2 > s1 && l2 > l1 ) ) ) ||
			// p1 retro, p2 direct; p1 longitude greater than p2 longitude
			( ( r1  && !r2 ) && ( l1 > l2 ) ) ||
			// p1 direct, p2 retro; p2 longitude greater than p2 longitude
			( ( !r1 &&  r2 ) && ( l2 > l1 ) )
		) { this.applying = true; } // it is applying
	};

	Aspect.prototype.getCoords = function() {
		return {
			x1: this.planet1.x,
			x2: this.planet2.x,
			y1: this.planet1.y,
			y2: this.planet2.y
		};
	};

	// define the Chart class
	Chart = function( el, width, height ) {
		this.width       = width;        // the width of the chart
		this.height      = height;       // the height of the chart
		this.outerRadius = Math.min( width, height ) / 2;       // the outer radius for the chart
		this.innerRadius = this.outerRadius - 50;  // the inner radius for the chart
		this.planets     = [];	       // the planets to draw on this chart
		this.aspects     = [];	       // the aspects between the planets
		this.ascendant   = 0;	        // the default ascendant
		// initialize the chart object
		this.chart = d3.select( '#' + el )
						.append( 'svg' )
						.attr( 'width', this.width )
						.attr( 'height', this.height );
		// initialize the svg object
		this.svg = this.chart.append( 'g' )
						.attr( "transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")" );
	};

	Chart.prototype.drawSpoke = function( angle, r1, r2, g, cls, ex ) {
		ex = undefined === ex ? 0 : ex;
		var rd = angle * Math.PI / 180,			 // the angle in radians
			// define four coords that specify beginning and end of line
			x1 = r1 * Math.cos( rd ),
			y1 = r1 * Math.sin( rd ),
			x2 = ( r2 + ex ) * Math.cos( rd ),
			y2 = ( r2 + ex ) * Math.sin( rd );

		// set default for ex
		ex = ex === 'undefined' ? 0 : ex; // number of pixels to go past r2

		// append the line to the chart
		g.append( 'line' ).attr( 'x1', x1 ).attr( 'x2', x2 ).attr( 'y1', y1 ).attr( 'y2', y2 ).attr( 'class', cls );
	};

	Chart.prototype.drawArc = function( inRad, outRad, rot, data, dFunc, tFunc, gclass, aclass ) {
		// initializations
		var self = this,
			pie = d3.layout.pie().sort( null ).value( dFunc ),
			arc = d3.svg.arc().innerRadius( inRad ).outerRadius( outRad ),
			tfx = function( d ) { return 'translate( ' + arc.centroid( d ) + ') rotate( ' + (-rot) + ', 0, 0 )'; },
			g   = self.svg.selectAll( '.' + gclass )
					.data( pie( data ) )
					.enter().append( 'g' )
					.attr( 'class', gclass )
					.attr( 'transform', 'rotate( ' + rot + ', 0, 0 )' ),
			isPtInArc, // function to determine if a given point lies within an arc
			labelArc;  // function to determine where to locate labels for arc segments

			// determines if a given point lies within an arc
			isPtInArc = function( pt, ptData ) {
				var r1     = arc.innerRadius()( ptData ),
					r2     = arc.outerRadius()( ptData ),
					theta1 = arc.startAngle()(  ptData ),
					theta2 = arc.endAngle()(    ptData ),
					dist   = pt.x * pt.x + pt.y * pt.y,
					angle  = Math.atan2( pt.x, -pt.y );
				angle = ( angle < 0 ) ? ( angle + Math.PI * 2 ) : angle;
				return ( r1 * r1 <= dist ) && ( dist <= r2 * r2 ) && ( theta1 <= angle ) && ( angle <= theta2 );
			};

			// determines where to locate labels for arc segments
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

		g.append( 'path' ).attr( 'd', arc ).attr( 'class', aclass );
		g.append( 'text' ).attr( 'transform', tfx ).attr( 'dy', '.35em' ).style( 'text-anchor', 'middle' ).text( tFunc ).each( labelArc );
	};

	Chart.prototype.drawHouses = function( houses ) {
		// variable declarations
		var self = this,
			r1   = self.outerRadius,       // outer radius of the entire chart
			r2   = self.innerRadius,       // inner radius of the entire chart
			tr   = r2 + 5,                 // tick radius
			tg   = self.svg.append( 'g' ), // tick group
			hg   = self.svg.append( 'g' ), // house group
			hd   = [],				     // house data
			rot  = self.ascendant - 90,    // 90 degree correction for how d3 draws arcs
			hang = 0,				      // cumulative house cusp angle
			ang, 					      // angle between houses
			next, 				         // the index of the next house in the cycle
			i,						     // counter for degrees 0 - 359
			ex, 					       // amount to extend tick markds
			mc,					        // midheaven cusp signifier
			// a data structure for drawing sign arcs
			zodiac = [
				{ v: 1, s: cmap.pisces      },
				{ v: 1, s: cmap.aquarius    },
				{ v: 1, s: cmap.capricorn   },
				{ v: 1, s: cmap.sagittarius },
				{ v: 1, s: cmap.scorpio     },
				{ v: 1, s: cmap.libra       },
				{ v: 1, s: cmap.virgo       },
				{ v: 1, s: cmap.leo         },
				{ v: 1, s: cmap.cancer      },
				{ v: 1, s: cmap.gemini      },
				{ v: 1, s: cmap.taurus      },
				{ v: 1, s: cmap.aries       }
			];

		// draw the ticks around the zodiac and rotate them appropriately
		tg.attr( 'class', 'ticks' );
		for ( i = 0; i < 360; i += 1 ) {
			if      ( 0 === i % 10 ) { ex = 10; } // major tick
			else if ( 0 === i %  5 ) { ex =  5; } // medium tick
			else				     { ex =  0; } // minor tick
			self.drawSpoke( i, r2, tr, tg, 'houses', ex );
		}

		// rotate the tick group to align with the signs on the chart
		tg.attr( 'transform', 'rotate( ' + rot + ' )' );

		// draw spokes for the houses; reverse order
		for ( i = 11; i >= 0; i -= 1 ) {
			next = 11 === i ? 0 : i + 1;
			if ( houses[ next ] > houses[ i ] ) {
				ang = houses[ next ] - houses[ i ];
			} else {
				ang = 360 - houses[ i ] + houses[ next ];
			}
			hd.push( ang );
			hang += ang;
			mc = ( i === 9 || i === 3 ) ? ' mc' : '';
			self.drawSpoke( hang, 40, r2, hg, 'cusp' + mc );
		}

		// draw the zodiac and the houses
		self.drawArc( r1, r2, rot, zodiac, function( d ) { return +d.v; }, function( d    ) { return d.data.s; }, 'zarc' );
		self.drawArc( 40, 75, -90,     hd, function( d ) { return d;    }, function( d, i ) { return 12 - i;   }, 'harc' );
	};

	Chart.prototype.drawPlanets = function() {
		var self = this,
			nodes = [], // the point and text nodes that mark the planets
			links = [], // the lines that connect planet symbol to the chart
			g,          // group to hold the planets
			collide,    // collision detection function
			f,          // the d3 force layout
			link;       // d3 group to hold links from symbol to chart

		// populate the nodes and links; start by adding earth to the center
		nodes.push( { name: 'earth', x: 0, y: 2, radius: 20, fixed: true, weight: 0 } );
		$.each( self.planets, function( i, p ) {
			var fixed = { x: p.x, y: p.y, radius: 0, fixed: true, weight: 1 };
			nodes.push( fixed );
			nodes.push( p );
			links.push( { source: fixed, target: p } );
		});

		// set up the force layout
		f = d3.layout.force()
			.gravity( 0.05 )
			.charge( function( d, i ) { return i ? 0 : -300; } )
			.nodes( nodes )
			.links( links )
			.size( [ 0, 0 ] ).start();

		g = this.svg.append( 'g' ).attr( 'class', 'planets' );
		g.selectAll( 'text' )
		.data( nodes )
		.enter().append( 'text' )
		.attr( 'x', function( p ) { return p.x; } )
		.attr( 'y', function( p ) { return p.y; } )
		.text( function( p, i ) { return 1 === i % 2 ? '' : cmap[ p.name ]; } )
		.attr( 'class', function( p ) { return 'planet ' + p.name; } );

		link = g.selectAll( '.link' )
			.data( links )
			.enter().append( 'line' )
			.attr( 'class', 'link' )
			.style( 'stroke', '#999' )
			.style( 'stroke-width', '2' );

		f.on( 'tick', function() {
			var q = d3.geom.quadtree( nodes ),
				i = 1,
				l = nodes.length;

			while ( i < l ) { q.visit( collide( nodes[ i ] ) ); i += 1; }

			g.selectAll( 'text' )
				.attr( 'x', function( d ) { return d.x; } )
				.attr( 'y', function( d ) { return d.name !== 'earth' ? d.y + 8 : d.y + 11; } );

			link.attr( 'x1', function( d ) { return d.source.x; } )
				.attr( 'y1', function( d ) { return d.source.y; } )
				.attr( 'x2', function( d ) { return d.target.x; } )
				.attr( 'y2', function( d ) { return d.target.y; } );
		});

		collide = function( node ) {
			var rad = node.radius + 16,
				nx1 = node.x - rad,
				nx2 = node.x + rad,
				ny1 = node.y - rad,
				ny2 = node.y + rad;
			return function( quad, x1, y1, x2, y2 ) {
				if ( quad.point && ( quad.point !== node ) ) {
					var x = node.x - quad.point.x,
						y = node.y - quad.point.y,
						h = Math.sqrt( x * x + y * y ),
						d = node.radius + quad.point.radius;
					if ( h < d ) {
						h = ( h - d ) / d * 0.5;
						x *= h;
						y *= h;
						node.x -= x;
						node.y -= y;
						quad.point.x += x;
						quad.point.y += y;
					}
				}
				return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
			};
		};
	};

	Chart.prototype.drawAspects = function() {
		var self = this, g = self.svg.append( 'g' ).attr( 'class', 'aspects' );
		$.each( self.aspects, function( i, aspect ) {
			if ( aspect.type !== 'conjunct' ) {
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

	Chart.prototype.drawPanel = function() {
		var self = this;
		// create toggles for planets and aspects in the control panel
		$.each( self.planets, function( i, p ) {
			$( '#planets_tab ul' ).append( '<li><label><input type="checkbox" checked name="' + p.name + '">' + p.name + '</label></li>' );
		});
		$.each( amap, function( a ) {
			if ( 'conjunct' !== a ) {
				$( '#aspects_tab ul' ).append( '<li><label><input type="checkbox" checked name="' + a + '">' + a + '</label></li>');
			}
		});
		$( '#planets_tab input[type="checkbox"]' ).on( 'change', function( e ) {
			if ( this.checked ) {
				$( '.' + this.name + ' text, .' + this.name ).fadeIn();
			} else {
				$( '.' + this.name + ' text, .' + this.name ).fadeOut();
			}
		});
		$( '#aspects_tab input[type="checkbox"]' ).on( 'change', function() {
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
		$( '#no_aspects' ).button().trigger( 'click' );
	};

	Chart.prototype.draw = function( cdata ) {

		var self = this;

		// set the ascendant for this chart
		self.ascendant = +cdata.ascendant;

		// add the horizon
		self.chart.insert( 'line', ':first-child' ).attr( 'x1', 0 ).attr( 'x2', self.width ).attr( 'y1', self.height / 2 ).attr( 'y2', self.height / 2 ).attr( 'stroke', '#666' ).attr( 'stroke-width', 2 );

		// draw the houses
		self.drawHouses( cdata.houses );

		// loop through the planets and add them to the global list
		$.each( cdata.planets, function( pname, p ) {
			// get the longitude for the chart and the xy coords
			var lon = 180 + self.ascendant - +p.lon,      // longitude for the chart: TEST THIS THOROUGHLY
				rad = lon * Math.PI / 180,                // radians of the longitude
				x   = self.innerRadius * Math.cos( rad ), // x coord on the chart
				y   = self.innerRadius * Math.sin( rad ); // y coord on the chart
			// add it to the global list of planets
			self.planets.push( new Planet( pname, lon, +p.r, x, y ) );
		});

		// loop through the planets and determine their aspects
		$.each( self.planets, function( i, p1 ) {
			$.each( self.planets, function( j, p2 ) {
				if ( i !== j && j > i ) {
					var aspect = new Aspect( p1, p2 );
					if ( aspect.type !== null ) {
						p1.addAspect( aspect );
						p2.addAspect( aspect );
						self.aspects.push( aspect );
					}
				}
			});
		});

		// draw the aspects
		self.drawAspects();

		// draw the planets
		self.drawPlanets();

		// set up the control panel
		self.drawPanel();
	};
//}());
