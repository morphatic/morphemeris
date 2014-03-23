<?php
	header( 'content-type: application/json' );
	//header( 'content-type: text/plain' );
	ini_set( 'display_errors', 0 );
	
	// get date parts and timezone; default 4/25/1976, 12:00 Eastern time
	$y = $_GET[ 'y' ] ?: 1970;
	$m = $_GET[ 'm' ] ?: 1;
	$d = $_GET[ 'd' ] ?: 1;
	$h = $_GET[ 'h' ] ?: 12;
	$i = $_GET[ 'i' ] ?: 0;
	$z = $_GET[ 'z' ] ?: 'America/New_York';
	
	// create the date object and convert to UTC
	$date = new DateTime();
	$date->setTimezone( new DateTimeZone( $z ) );
	$date->setDate( $y, $m, $d );
	$date->setTime( $h, $i, 00 );
	$date->setTimezone( new DateTimeZone( 'UTC' ) );
	
	// convert to Julian day number
	$jd = $date->getTimestamp() / 86400 + 2440587.5;
	//echo "$jd\n\n";
	echo strtolower( `./morph -d$jd` );