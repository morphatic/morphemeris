#include <stdio.h>
#include <string.h>
#include "swephexp.h" 	/* this includes  "sweodef.h" */

int main( int argc, char *argv[] ) {

	char json[10000], jtemp[200];
	int i;
	double jd = 2442096.4791667, cusps[13], ascmc[10], lat = 37.438205, lon = -79.187155; // morgan: 2442096.4791667, nicole: 2442894.1666667
	
	// parse command line parameters
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
	}

	// set up path to ephemeris files
	swe_set_ephe_path( "ephe" );

	// start json output
	strcat( json, "{\"houses\":[" );

	// calculate houses, ascendant, and midheaven
	swe_houses( jd, lat, lon, 'P', cusps, ascmc );

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
