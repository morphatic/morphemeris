<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        
        <title>Natal Chart Aspect Calculator</title>
        
        <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css">
        <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap-theme.min.css">
        <link rel="stylesheet" href="css/datetimepicker.min.css">
        <link rel="stylesheet" href="css/style.css">
    </head>
    <body>
        <!-- Navbar -->
        <div class="navbar navbar-default navbar-fixed-top" role="navigation">
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
                <h1>Natal Chart Aspect Calculator</h1>
            </div>
            <p class="lead">Enter the date and time (if you know the time, otherwise leave at noon) and timezone of your birth:</p>
            <div class="well">
                <div class="form-group">
                    <div id="natal_datetime" class="input-group date">
                        <input id="birthday" type="text" class="form-control">
                        <span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span>
                    </div>
                    <div class="input-group">
                        <input id="timezone" type="text" value="America/New_York" class="form-control">
                    </div>
                    <br>
                    <button id="calculate" class="btn btn-primary">Calculate Your Aspects</button>
                </div>
            </div>
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