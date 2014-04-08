<?php
	header( 'content-type: application/json' );
	ini_set( 'display_errors', 0 );
	
	// get birthday and timezone; default 4/25/1976, 12:00 Eastern time
	$bd  = $_GET[ 'date' ] ?: '2/17/1974 7:30 PM';
	$lat = $_GET[ 'lat'  ] ?: 37.438205;
	$lon = $_GET[ 'lon'  ] ?: -79.187155;
	$z   = $_GET[ 'tz'   ] ?: 'America/New_York';
	
	// create the date object and convert to UTC
	$date = new DateTime( $bd, new DateTimeZone( $z ) );
	$date->setTimezone( new DateTimeZone( 'UTC' ) );
	
	// convert to Julian day number
	$jd = $date->getTimestamp() / 86400 + 2440587.5;
	$out = strtolower( preg_replace( '/^.*?{/', '{', `./houses -d$jd -a$lat -o$lon` ) );
	echo $out;