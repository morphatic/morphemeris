<?php
	header( 'content-type: application/json' );
	ini_set( 'display_errors', 0 );
	
	// get birthday and timezone; default 4/25/1976, 12:00 Eastern time
	$bd = $_GET[ 'date' ] ?: '4/25/1976 9:02 AM';
	$z  = $_GET[ 'timezone' ] ?: 'America/New_York';
	
	// create the date object and convert to UTC
	$date = new DateTime( $bd, new DateTimeZone( $z ) );
	$date->setTimezone( new DateTimeZone( 'UTC' ) );
	
	// convert to Julian day number
	$jd = $date->getTimestamp() / 86400 + 2440587.5;
	echo strtolower( `./morph -d$jd` );