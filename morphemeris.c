#include <stdio.h>

int main( int argc, char *argv[] ) {
	
	char pname[40], serr[AS_MAXCH];
	int p;
	double jdn, x2[6];
	long x;
	
	// set up path to ephemeris files
	// swe_set_ephe_path( "ephe" );
	
	// set the julian day number
	jdn = swe_julday( 1974, 2, 17, 0.0, SE_GREG_CAL );
	
	// compute ephemeris time
	jdn = jdn + swe_deltat( jdn );
	
	// print out column headers
	printf("planet    \tlongitude\tlatitude\tdistance\tspeed long.\n");
	
	// loop through all planets
	for ( p = SE_SUN; p <= SE_CHIRON; p++ ) {
		if ( SE_EARTH == p ) continue;
		x = swe_calc_ut( jdn, p, SEFLG_SPEED, x2, serr );
		if ( x < 0 ) printf( "error: %s\n", serr );
		swe_get_planet_name( p, pname );
		printf( "%10s\t%11.7f\t%10.7f\t%10.7f\t%10.7f\n", pname, x2[0], x2[1], x2[2], x2[3] );
	}
	
	return 0;
}