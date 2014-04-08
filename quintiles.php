<?php
	//header( 'content-"type" => text/plain' );
	function getSign( $angle ) {
		$signs = [
			'aries'       =>  30,
			'taurus'      =>  60,
			'gemini'      =>  90,
			'cancer'      => 120,
			'leo'         => 150,
			'virgo'       => 180,
			'libra'       => 210,
			'scorpio'     => 240,
			'sagittarius' => 270,
			'capricorn'   => 300,
			'aquarius'    => 330,
			'pisces'      => 360,
		];
		
		foreach ( $signs as $sign => $degree ) if ( $angle < $degree ) return $sign;		
	}

	function cOut( $p ) {
		$cmap = [
			"sun"        => 'a',
			"moon"       => 's',
			"mercury"    => 'd',
			"venus"      => 'f',
			"mars"       => 'h',
			"jupiter"    => 'j',
			"saturn"     => 'k',
			"uranus"     => '&ouml;',
			"neptune"    => '&auml',
			"pluto"      => '#',
			"south node" => '&szlig;',
			"north node" => '?',
			"ceres"      => 'A',
			"pallas"     => 'S',
			"juno"       => 'D',
			"vesta"      => 'F',
			"lilith"     => '&ccedil;',
			"cupido"     => 'L',
			"chiron"     => 'l',
			"nessus"     => '&ograve;',
			"pholus"     => '&ntilde;',
			"chariklo"   => '&icirc;',
			"aries"      => 'q',
			"taurus"     => 'w',
			"gemini"     => 'e',
			"cancer"     => 'r',
			"leo"        => 't',
			"virgo"      => 'z',
			"libra"      => 'u',
			"scorpio"    => 'i',
			"sagittarius"=> 'o',
			"capricorn"  => 'p',
			"aquarius"   => '&uuml;',
			"pisces"     => '+',
			"conjunct"   => '<',
			"sextile"    => 'x',
			"quintile"   => 'Y',
			"square"     => 'c',
			"trine"      => 'Q',
			"biquintile" => 'C',
			"inconjunct" => 'n',
			"opposition" => 'm'
		];
		return array_key_exists( $p, $cmap ) ? '<span class="kairon">' . $cmap[ $p ] . '</span>' : $p;
	}

	function getAspect( $p1, $p2 ) {
		// create an array of real planets
		$planets = [ 'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto' ];
		$aspect = '';
		
		// get the angle between the two planets
		$angle = abs( $p1->lon - $p2->lon );
		if ( $angle > 186 ) $angle = $p1->lon > $p2->lon ? 360 - $p1->lon + $p2->lon : 360 - $p2->lon + $p1->lon;
		
		// is it a quintile or biquintile?
		if ( $angle >= 69.5 && $angle <= 74.5 ) {
			// quintile
			$aspect = 'quintile';
		} elseif ( $angle >= 141.5 && $angle <= 146.5 ) {
			// biquintile
			$aspect = 'biquintile';
		} else {
			// neither
			return false;
		}
		// get the signs
		$s1 = getSign( $p1->lon );
		$s2 = getSign( $p2->lon );
		$p2p = in_array( $p1->name, $planets ) && in_array( $p2->name, $planets );
		$relation = cOut($p1->name) . '(' . cOut($s1) . ')-' . cOut($p2->name) . '(' . cOut($s2) . ')';
		return [ 'aspect' => $aspect, 'relation' => $relation, 'p2p' => $p2p ];
	}
	
	// create an array to hold the resulting data
	$quintiles = [];
	
	// open the CSV with the data
	$people = file( 'catalyst_week_participants.csv' );
	
	// create an array for partners; drop the first person, so not to compare to self
	$partners = [];
	
	// loop through the file
	foreach( $people as $person ) {
		$plnts  = [ 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 
					'neptune', 'pluto', 'north node', 'chiron', 'pholus', 'ceres', 'pallas', 
					'juno', 'vesta', 'cupido', 'chariklo', 'chaos', 'eris', 'nessus' ];
		$person = str_getcsv( trim( $person ) );
		$name = $person[ 0 ];
		$bd   = $person[ 1 ];
		//$bt   = $person[ 2 ];
		$tz   = $person[ 2 ];
		
		// create the date object and convert to UTC
		$date = new DateTime( $bd, new DateTimeZone( $tz ) );
		$date->setTimezone( new DateTimeZone( 'UTC' ) );

		// convert to Julian day number
		$jd      = $date->getTimestamp() / 86400 + 2440587.5;
		$planets = json_decode( strtolower( preg_replace( '/^.*?{/', '{', `./morph -d$jd` ) ) );

		$partners[] = [ 'name' => $name, 'bd' => $bd, 'tz' => $tz, 'p' => $planets ];
		
		// loop through the planets
		foreach ( $planets as $planet ) {
			foreach ( $plnts as $plnt ) {
				$aspect = false;
				if ( $aspect = getAspect( $planet, $planets->{$plnt} ) ) {
					if ( 'quintile' == $aspect[ 'aspect' ] ) {
						if ( $aspect[ 'p2p' ] ) {
							$quintiles[ $name ][ 'quintiles' ][ 'p2p' ][] = $aspect[ 'relation' ];
						} else {
							$quintiles[ $name ][ 'quintiles' ][ 'other' ][] = $aspect[ 'relation' ];
						}
					} else {
						if ( $aspect[ 'p2p' ] ) {
							$quintiles[ $name ][ 'biquintiles' ][ 'p2p' ][] = $aspect[ 'relation' ];
						} else {
							$quintiles[ $name ][ 'biquintiles' ][ 'other' ][] = $aspect[ 'relation' ];
						}
					}
				}
			}
			array_shift( $plnts );
		}
	}
	
	// now calculate paired quintiles using synastry
	$people = $partners;
	array_shift( $partners );
	foreach ( $people as $person ) {
		$c1 = $person[ 'p' ];
		foreach ( $partners as $partner ) {
			$c2 = $partner[ 'p' ];
			$name = $person[ 'name' ] . ' - ' . $partner[ 'name' ];
			foreach ( $c1 as $p1 => $d1 ) {
				foreach ( $c2 as $p2 => $d2 ) {
					$aspect = false;
					if ( $aspect = getAspect( $d1, $d2 ) ) {
						if ( $aspect[ 'p2p' ] ) {
							if ( 'quintile' == $aspect[ 'aspect' ] ) {
								$quintiles[ $name ][ 'quintiles' ][ 'p2p' ][] = $aspect[ 'relation' ];
							} else {
								$quintiles[ $name ][ 'biquintiles' ][ 'p2p' ][] = $aspect[ 'relation' ];
							}
						}
					}
				}
			}
		}
		array_shift( $partners );
	}
?><!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>Quintile Calculator</title>

        <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css">
        <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap-theme.min.css">
        <link rel="stylesheet" href="css/datetimepicker.min.css">
        <link rel="stylesheet" href="css/style.css">
    </head>
    <body>
        <!-- Navbar -->
        <div class="navbar navbar-default navbar-fixed-top transparent navbar-inverse" role="navigation">
            <div class="container">
                <div class="navbar-header">
                    <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
                        <span class="sr-only">Toggle navigation</span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                    </button>
                    <a class="navbar-brand" href="#">Natal Chart Aspect Calculator</a>
                </div>
                <div class="collapse navbar-collapse">
                    <ul class="nav navbar-nav">
                        <li class="active"><a href="#">Home</a></li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="container">
            <div class="page-header">
                <h1>Quintile Calculator</h1>
            </div>
			<table class="table table-bordered table-condensed">
				<tbody>
				<?php
					foreach ( $quintiles as $person => $quintile ) {
						echo '<tr><td colspan="3" class="info"><strong>' . $person . '</strong></td></tr>';
						echo '<tr><td>&nbsp;</td><th>P2P</th><th>Other</th></tr>';
						echo '<tr><th>Quintiles</th><td>';
						if ( isset( $quintile[ 'quintiles' ][ 'p2p' ] ) && is_array( $quintile[ 'quintiles' ][ 'p2p' ] ) ) {
							echo '<ul>';
							foreach ( $quintile[ 'quintiles' ][ 'p2p' ] as $q ) echo "<li>$q</li>";
							echo '</ul>';
						} else echo '&nbsp;';
						echo '</td><td>';
						if ( isset( $quintile[ 'quintiles' ][ 'other' ] ) && is_array( $quintile[ 'quintiles' ][ 'other' ] ) ) {
							echo '<ul>';
							foreach ( $quintile[ 'quintiles' ][ 'other' ] as $q ) echo "<li>$q</li>";
							echo '</ul>';
						} else echo '&nbsp;';
						echo '</td></tr>';
						echo '<tr><th>Biquintiles</th><td>';
						if ( isset( $quintile[ 'biquintiles' ][ 'p2p' ] ) && is_array( $quintile[ 'biquintiles' ][ 'p2p' ] ) ) {
							echo '<ul>';
							foreach ( $quintile[ 'biquintiles' ][ 'p2p' ] as $q ) echo "<li>$q</li>";
							echo '</ul>';
						} else echo '&nbsp;';
						echo '</td><td>';
						if ( isset( $quintile[ 'biquintiles' ][ 'other' ] ) && is_array( $quintile[ 'biquintiles' ][ 'other' ] ) ) {
							echo '<ul>';
							foreach ( $quintile[ 'biquintiles' ][ 'other' ] as $q ) echo "<li>$q</li>";
							echo '</ul>';
						} else echo '&nbsp;';
						echo '</td></tr>';
					}
				?>
				</tbody>
			</table>
        </div>

        <!-- Footer -->
        <div id="footer">
            <div class="container">
                <p class="text-muted">&copy; 2014 <a href="http://www.burningmindproject.org">The Burning Mind Project</a></p>
            </div>
        </div>

        <!-- javascript -->
        <script src="//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min.js"></script>
        <script src="//code.jquery.com/jquery-2.1.0.min.js"></script>
        <script src="//cdnjs.cloudflare.com/ajax/libs/moment.js/2.5.1/moment.min.js"></script>
        <script src="//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min.js"></script>
        <script src="js/datetimepicker.min.js"></script>
        <script src="js/aspect_calculator.js"></script>
    </body>
</html>