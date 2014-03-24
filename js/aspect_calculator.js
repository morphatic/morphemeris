jQuery( function( $ ) {
	
	// set up font map
	var plist  = [ 'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'true node', 'ceres', 'pallas', 'juno', 'vesta' ],
		//rplist = [ 'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'true node', 'mean node', 'ceres', 'pallas', 'juno', 'vesta' ],
		rplist = [ 'chiron', 'vesta', 'juno', 'pallas', 'ceres', 'true node', 'pluto', 'neptune', 'uranus', 'saturn', 'jupiter', 'mars', 'venus', 'mercury', 'moon' ],
		cmap = {
			sun: 'a',
			moon: 's',
			mercury: 'd',
			venus: 'f',
			mars: 'h',
			jupiter: 'j',
			saturn: 'k',
			uranus: '&ouml;',
			neptune: '&auml',
			pluto: '#',
			"true node": '&szlig;',
			"mean node": '?',
			ceres: 'A',
			pallas: 'S',
			juno: 'D',
			vesta: 'F',
			lilith: '&ccedil;',
			cupido: 'L',
			chiron: 'l',
			conjunct: '<',
			sextile: 'x',
			quintile: 'Y',
			square: 'c',
			trine: 'Q',
			biquintile: 'C',
			inconjunct: 'n',
			opposition: 'm'
		}, getAspect, omit = [], out='<tr><td>&nbsp;</td>', stop;
	
	getAspect = function( angle ) {
		if      ( angle <=   6 )                 { return 'conjunct';   }
		else if ( angle >=  54 && angle <=  66 ) { return 'sextile';    }
		else if ( angle >=  69 && angle <=  75 ) { return 'quintile';   }
		else if ( angle >=  84 && angle <=  96 ) { return 'square';     }
		else if ( angle >= 114 && angle <= 126 ) { return 'trine';      }
		else if ( angle >= 142 && angle <= 146 ) { return 'biquintile'; }
		else if ( angle >= 107 && angle <= 113 ) { return 'inconjunct'; }
		else if ( angle >= 174 && angle <= 186 ) { return 'opposition'; }
		return '';
	};
	
	// set up the datetimepicker
	$( '#natal_datetime' ).datetimepicker( { useSeconds: false, maxDate: new Date(), defaultDate: "4/25/1976 9:02 AM" } );
	
	// handle the calculate button click
	$( '#calculate' ).click( function() {
		$.get( 'ephemeris.php', { date: $( '#birthday' ).val(), timezone: $( '#timezone' ).val() } )
		 .done( function( planets ) {
			$.each( plist, function( i, p ) {
				out += '<td class="kairon">' + cmap[ p ] + '</td>';
			});
			$.each( rplist, function( i, p1 ) {
				out += '</tr><tr><td class="kairon">' + cmap[ p1 ] + '</td>';
				stop = false;
				$.each( plist, function( j, p2 ) {
					if ( stop || p1 == p2 ) { stop = true; return;}
					var aspect = getAspect( Math.abs( planets[ p1 ].lon - planets[ p2 ].lon ) );
					out += '' != aspect ? '<td><span class="kairon ' + aspect + '">' + cmap[ aspect ] + '</span></td>' : '<td>&nbsp;</td>';
				});
				out += '</tr>';
			});
			$( '#aspects_table' ).append( out );
		 });
	});
});