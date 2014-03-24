jQuery( function( $ ) {
	
	// set up font map
	var cmap = {
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
		}, getAspect, omit = [];
	
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
			$.each( planets, function( p1, d1 ) {
				omit.push( p1 );
				$.each( _.omit( planets, omit ), function( p2, d2 ) {
					var aspect;
					aspect = getAspect( Math.abs( d1.lon - d2.lon ) );
					if ( '' != aspect ) console.log( p1 + ' ' + aspect + ' ' + p2 );
				});
			});
		 });
	});
});