#include <stdio.h>
#include <string.h>
#include "swephexp.h" 	/* this includes  "sweodef.h" */

int main( int argc, char *argv[] ) {

	char	pname[40],	  // planet name
			serr[AS_MAXCH], // to hold error messages
			json[10000],	// to hold the JSON output
			jtemp[200],	 // to hold pieces of the JSON before adding to ouput
			hs = 'P';	   // house system; defaults to P
	int 	i, // iterator
			r = 0,  // is the planet retrograde?
			p = 22, // number of planets/objects we're tracking
			planets[22] = {
				0,  // sun
				1,  // moon
				2,  // mercury
				3,  // venus
				4,  // mars
				5,  // jupiter
				6,  // saturn
				7,  // uranus
				8,  // neptune
				9,  // pluto
				10, // mean node
				15, // chiron
				16, // pholus
				17, // ceres
				18, // pallas
				19, // juno
				20, // vesta
				40, // cupido
				SE_AST_OFFSET + 10199,  // chariklo
				SE_AST_OFFSET + 19521,  // chaos
				SE_AST_OFFSET + 136199, // eris
				SE_AST_OFFSET + 7066    // nessus
			};
	double  jd = 2442894.1666667, // Julian date; defaults to Nicole; in future NO default, throw error
			cusps[13], // array to hold house cusp info
			ascmc[10], // array to hold ascendant and midheaven info
			lat,       // latitude for natal chart
			lon,       // longitude for natal chart
			snlon,     // longitude for the south node
			x2[6];     // array to hold the results of swe_calc_ut--planet positions
	long x; // holds output from swe_calc_ut; x < 0 indicates error

	// parse command line parameters
	// -d Julian day
	// -a Latitude
	// -o Longitude
	// -h House system; defaults to P
	for ( i = 1; i < argc; i++ ) {
		if ( strncmp( argv[ i ], "-d", 2 ) == 0 ) {
			sscanf( argv[ i ] + 2, "%lf", &jd );
		}
		if ( strncmp( argv[ i ], "-a", 2 ) == 0 ) {
			sscanf( argv[ i ] + 2, "%lf", &lat );
		}
		if ( strncmp( argv[ i ], "-o", 2 ) == 0 ) {
			sscanf( argv[ i ] + 2, "%lf", &lon );
		}
		if ( strncmp( argv[ i ], "-h", 2 ) == 0 ) {
			sscanf( argv[ i ] + 2, "%s", &hs );
		}
	}

	// set up path to ephemeris files
	swe_set_ephe_path( "ephe" );

	// start planet output
	strcat( json, "{\"planets\":{" );

	// loop through all planets
	for ( i = 0; i < p; i++ ) {
		x = swe_calc_ut( jd, planets[ i ], SEFLG_SPEED, x2, serr );
		if ( x < 0 ) printf( "error: %s\n", serr );
		swe_get_planet_name( planets[ i ], pname );
		if ( 0 == strcmp( pname, "mean Node" ) ) {
			strcpy( pname, "North Node");
		}
		r = x2[ 3 ] < 0 ? 1 : 0;
		sprintf( jtemp, "\"%s\":{\"name\":\"%s\",\"lon\":\"%f\",\"lat\":\"%f\",\"spd\":\"%f\",\"r\":\"%i\"},", pname, pname, x2[ 0 ], x2[ 1 ], x2[ 3 ], r );
		strcat( json, jtemp );
		if ( 0 == strcmp( pname, "North Node" ) ) {
			snlon = x2[ 0 ] + 180 > 360 ? fmod( x2[ 0 ] + 180, 360 ) : x2[ 0 ] + 180;
			sprintf( jtemp, "\"%s\":{\"name\":\"%s\",\"lon\":\"%f\",\"lat\":\"%f\",\"spd\":\"%f\",\"r\":\"%i\"},", "South Node", "South Node", snlon, x2[ 1 ], x2[ 3 ], r );
			strcat( json, jtemp );
		}
	}
	json[ strlen( json ) - 1 ] = '\0';
	strcat( json, "}," );

	// start the Houses
	strcat( json, "\"houses\":[" );

	// calculate houses, ascendant, and midheaven
	swe_houses( jd, lat, lon, hs, cusps, ascmc );

	// loop through the houses
	for ( i = 1; i <= 12; i++ ) {
		sprintf( jtemp, "%f,", cusps[ i ] );
		strcat( json, jtemp );
	}

	// remove trailing comma and add closing brackets
	json[ strlen( json ) - 1 ] = '\0';
	strcat( json, "]," );

	// add the ascendant and midheaven
	sprintf( jtemp, "\"ascendant\":\"%f\",\"mc\":\"%f\"", ascmc[ 0 ], ascmc[ 1 ] );
	strcat( json, jtemp );

	// add the trailing curly brace and output the result
	strcat( json, "}" );
	printf( "%s", json );

	return 0;
}
