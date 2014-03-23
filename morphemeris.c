#include <stdio.h>
#include "swephexp.h" 	/* this includes  "sweodef.h" */

int main( int argc, char *argv[] ) {
	
	char pname[40], serr[AS_MAXCH], json[10000], jtemp[200];
	int p, i;
	double jd = 2442894.1666667, x2[6];
	long x;
	
	// parse command line parameters
	for ( i = 1; i < argc; i++ ) {
		if ( strncmp( argv[ i ], "-d", 2 ) == 0 ) {
			sscanf( argv[ i ] + 2, "%lf", &jd );
		}
	}
	
	// set up path to ephemeris files
	swe_set_ephe_path( "ephe" );
	
	strcat( json, "{" );
	
	// loop through all planets
	for ( p = SE_SUN; p <= SE_VESTA; p++ ) {
		if ( SE_EARTH == p ) continue;
		x = swe_calc_ut( jd, p, SEFLG_SPEED, x2, serr );
		if ( x < 0 ) printf( "error: %s\n", serr );
		swe_get_planet_name( p, pname );
		sprintf( jtemp, "\"%s\":{\"lon\":\"%f\",\"lat\":\"%f\",\"spd\":\"%f\"},", pname, x2[ 0 ], x2[ 1 ], x2[ 3 ] );
		strcat( json, jtemp );
	}
	json[ strlen( json ) - 1 ] = '\0';
	strcat( json, "}" );
	printf( "%s", json );
	
	return 0;
}