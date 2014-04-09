<?php
	header( 'content-type: application/json' );
	ini_set( 'display_errors', 0 );

	// set the default timezone to UTC
	date_default_timezone_set( 'UTC' );

	// get birthday and timezone; defaults to now
	$bd  = $_GET[ 'date' ] ?: date( 'n/j/Y g:i A' );
	$lat = $_GET[ 'lat'  ] ?: 37.438205;
	$lon = $_GET[ 'lon'  ] ?: -79.187155;
	$z   = $_GET[ 'tz'   ] ?: 'UTC';

	// create the date object and convert to UTC
	$date = new DateTime( $bd, new DateTimeZone( $z ) );
	$date->setTimezone( new DateTimeZone( 'UTC' ) );

	// convert to Julian day number
	$jd = $date->getTimestamp() / 86400 + 2440587.5;
	$out = strtolower( preg_replace( '/^.*?{/', '{', `./morphemeris -d$jd -a$lat -o$lon` ) );
	echo $out;
