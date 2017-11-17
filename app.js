//. app.js

var express = require( 'express' ),
    cfenv = require( 'cfenv' ),
    cloudantlib = require( 'cloudant' ),
    multer = require( 'multer' ),
    basicAuth = require( 'basic-auth-connect' ),
    bodyParser = require( 'body-parser' ),
    ejs = require( 'ejs' ),
    fs = require( 'fs' ),
    http = require( 'http' ),
    app = express();
var settings = require( './settings' );
var cloudant = cloudantlib( { account: settings.cloudant_username, password: settings.cloudant_password } );
var appEnv = cfenv.getAppEnv();

app.use( multer( { dest: './tmp/' } ).single( 'image_file' ) );
app.use( bodyParser.urlencoded( { extended: true, limit: '10mb' } ) );
app.use( bodyParser.json( { limit: '10mb' } ) );
app.use( express.static( __dirname + '/public' ) );

if( settings.basic_username && settings.basic_password ){
  app.all( '*', basicAuth( function( user, pass ){
    return( user === settings.basic_username && pass === settings.basic_password );
  }));
}

var port = appEnv.port || 3000;

app.get( '/', function( req, res ){
  res.write( 'ok' );
  res.end();
});

//. DB追加
cloudant.db.get( settings.cloudant_db, function( err, body ){
  if( err ){
    if( err.statusCode == 404 ){
      cloudant.db.create( settings.cloudant_db, function( err, body ){
        if( err ){
          db = null;
        }else{
          db = cloudant.db.use( settings.cloudant_db );
        }
      });
    }else{
      db = null;
    }
  }else{
    db = cloudant.db.use( settings.cloudant_db );
  }
});

//. アクティビティ追加
app.post( '/activity', function( req, res ){
  if( db ){
    var activity = req.body;
    if( activity ){
      //. 現在日付時刻
      var now = new Date();
      var y = now.getFullYear();
      var m = now.getMonth() + 1; m = ( ( m < 10 ) ? '0' : '' ) + m;
      var d = now.getDate(); d = ( ( d < 10 ) ? '0' : '' ) + d;
      var h = now.getHours(); h = ( ( h < 10 ) ? '0' : '' ) + h;
      var n = now.getMinutes(); n = ( ( n < 10 ) ? '0' : '' ) + n;
      var s = now.getSeconds(); s = ( ( s < 10 ) ? '0' : '' ) + s;
      var ymdhns = y + "-" + m + "-" + d + " " + h + ":" + n + ":" + s;

      var param = {
        datetime: ymdhns,
        activity: activity
      };

      db.insert( param, function( err, body, header ){
        if( err ){
          res.status( 400 );
          res.write( JSON.stringify( { status: false, message: err }, 2, null ) );
          res.end();
        }else{
          res.write( JSON.stringify( { status: true, body: body }, 2, null ) );
          res.end();
        }
      });
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: false, message: 'POST body required.' }, 2, null ) );
      res.end();
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, message: 'failed to initialize cloudant.' }, 2, null ) );
    res.end();
  }
});

//. アクティビティ削除
app.delete( '/activity/:id', function( req, res ){
  if( db ){
    var id = req.params.id;
    if( id ){
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: false, message: 'parameter id required.' }, 2, null ) );
      res.end();
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, message: 'failed to initialize cloudant.' }, 2, null ) );
    res.end();
  }
});

//. アクティビティ取得
app.get( '/activity/:id', function( req, res ){
  if( db ){
    var id = req.params.id;
    if( id ){
      db.get( id, { include_docs: true }, function( err, body ){
        if( err ){
          res.status( 400 );
          res.write( JSON.stringify( { status: false, message: err }, 2, null ) );
          res.end();
        }else{
          res.write( JSON.stringify( { status: true, id: id, body: body }, 2, null ) );
          res.end();
        }
      });
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: false, message: 'parameter id required.' }, 2, null ) );
      res.end();
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, message: 'failed to initialize cloudant.' }, 2, null ) );
    res.end();
  }
});


//. アクティビティ検索
app.post( '/search', function( req, res ){
    res.status( 400 );
    res.write( JSON.stringify( { status: false, message: 'not implemented yet.' }, 2, null ) );
    res.end();
});

app.listen( port );
console.log( "server starting on " + port + " ..." );


