//. app.js


//. Cloudant REST APIs
//. https://console.bluemix.net/docs/services/Cloudant/api/database.html#databases

//. npm cloudant
//. https://www.npmjs.com/package/cloudant

//. References
//. http://www.atmarkit.co.jp/ait/articles/0910/26/news097.html

var express = require( 'express' ),
    cfenv = require( 'cfenv' ),
    cloudantlib = require( 'cloudant' ),
    cors = require( 'cors' ),
    multer = require( 'multer' ),
    basicAuth = require( 'basic-auth-connect' ),
    bodyParser = require( 'body-parser' ),
    ejs = require( 'ejs' ),
    fs = require( 'fs' ),
    request = require( 'request' ),
    app = express();
var settings = require( './settings' );
var cloudant = cloudantlib( { account: settings.cloudant_username, password: settings.cloudant_password } );
var appEnv = cfenv.getAppEnv();

app.use( multer( { dest: './tmp/' } ).single( 'image_file' ) );
app.use( bodyParser.urlencoded( { extended: true, limit: '10mb' } ) );
app.use( bodyParser.json( { limit: '10mb' } ) );
app.use( express.static( __dirname + '/public' ) );
//app.use( cors() );

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

          //. distinct(user_id) 検索用の Design Document
          var postdata = {
            _id: "_design/user_id_list",
            language: "javascript",
            views: {
              user_id_list: {
                map: "function( doc ){ if( doc.activity ){ emit( doc.activity.user_id, null ); } }",
                reduce: "function( keys, values, rereduce ){ return null; }"
              }
            }
          };

          db.insert( postdata, function( err, body, header ){
            if( err ){
              console.log( err );
            }else{
              console.log( body );
            }
          });

          //. by user_id 検索用の Design Document
          var postdata1 = {
            language: "query",
            indexes: {
              user_id_index: {
                index: {
                  default_analyzer: "keyword",
                  default_field: {},
                  selector: {},
                  fields: [
                    { name: "activity.user_id", type: "string" }
                  ],
                  index_array_lengths: true
                }
              },
              datetime_index: {
                index: {
                  default_analyzer: "keyword",
                  default_field: {},
                  selector: {},
                  fields: [
                    { name: "datetime", type: "datetime" }
                  ],
                  index_array_lengths: true
                }
              }
            }
          };
          db.insert( postdata1, function( err, body1, header1 ){
            if( err1 ){
              console.log( err1 );
            }else{
              console.log( body1 );
            }
          });
        }
      });
    }else{
      db = null;
    }
  }else{
    db = cloudant.db.use( settings.cloudant_db );
  }
});


//. DBリセット
app.post( '/resetdb', function( req, res ){
  cloudant.db.destroy( settings.cloudant_db, function( err, body ){
    cloudant.db.create( settings.cloudant_db, function( err, body ){
      if( err ){
        db = null;
        res.status( 400 );
        res.write( JSON.stringify( { status: false, message: err }, 2, null ) );
        res.end();
      }else{
        db = cloudant.db.use( settings.cloudant_db );

        //. distinct(user_id) 検索用の Design Document
        var postdata = {
          _id: "_design/user_id_list",
          language: "javascript",
          views: {
            user_id_list: {
              map: "function( doc ){ if( doc.activity ){ emit( doc.activity.user_id, null ); } }",
              reduce: "function( keys, values, rereduce ){ return null; }"
            }
          }
        };

        db.insert( postdata, function( err, body, header ){
          if( err ){
          }else{
          }
        });

        //. by user_id 検索用の Design Document
        var postdata1 = {
          language: "query",
          indexes: {
            user_id_index: {
              index: {
                default_analyzer: "keyword",
                default_field: {},
                selector: {},
                fields: [
                  { name: "activity.user_id", type: "string" }
                ],
                index_array_lengths: true
              }
            },
            datetime_index: {
              index: {
                default_analyzer: "keyword",
                default_field: {},
                selector: {},
                fields: [
                  { name: "datetime", type: "datetime" }
                ],
                index_array_lengths: true
              }
            }
          }
        };
        db.insert( postdata1, function( err, body1, header1 ){
          if( err1 ){
          }else{
          }
        });

        res.write( JSON.stringify( { status: true, body: body }, 2, null ) );
        res.end();
      }
    });
  });
});


//. アクティビティ追加
app.post( '/activity', cors(), function( req, res ){
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
      var ms = now.getMilliseconds(); ms = ( ( ms < 10 ) ? '00' : ( ms < 100 ? '0' : '' ) ) + ms;
      var ymdhns = y + "-" + m + "-" + d + " " + h + ":" + n + ":" + s + "." + ms;

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


//. user_id 一覧
//. https://stackoverflow.com/questions/2534376/how-do-i-do-the-sql-equivalent-of-distinct-in-couchdb
//. GET https://cloudant_username.cloudant.com/activities/_design/user_id_list/_view/user_id_list?group=true
app.get( '/user_ids', function( req, res ){
  if( db ){
    db.view( 'user_id_list', 'user_id_list', { group: true }, function( err, body ){
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, message: err }, 2, null ) );
        res.end();
      }else{
        var ids = [];
        body.rows.forEach( function( element ){
          ids.push( element.key );
        });
        res.write( JSON.stringify( { status: true, body: ids }, 2, null ) );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, message: 'failed to initialize cloudant.' }, 2, null ) );
    res.end();
  }
});

//. user_id で検索
//. https://qiita.com/shimac/items/42021a5372883a1edf7c
app.get( '/activities/:user_id', function( req, res ){
  var user_id = req.params.user_id;
  if( user_id ){
    if( db ){
      var query = {
        selector: {
          "activity.user_id": {
            "$eq": user_id
          }
        },
        fields: [ "_id", "activity", "datetime" ],
        sort: [ { "_id": "asc" } ]
      };

      db.find( query, function( err, body ){
        if( err ){
          res.status( 400 );
          res.write( JSON.stringify( { status: false, message: err }, 2, null ) );
          res.end();
        }else{
          res.write( JSON.stringify( { status: true, body: body.docs }, 2, null ) );
          res.end();
        }
      });
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: false, message: 'failed to initialize cloudant.' }, 2, null ) );
      res.end();
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, message: 'parameter user_id required.' }, 2, null ) );
    res.end();
  }
});

//. アクティビティ検索
app.post( '/search', function( req, res ){
    res.status( 400 );
    res.write( JSON.stringify( { status: false, message: 'not implemented yet.' }, 2, null ) );
    res.end();
});

//. Anti Cross Site
app.get( '/spoof', function( req, res ){
  var url = req.params.url;
  if( url ){
    var basehost = '';
    var n1 = url.indexOf( '//' );
    if( n1 > -1 ){
      var n2 = url.indexOf( '/', n1 + 2 );
      if( n2 > n1 + 2 ){
        baseurl = url.substring( 0, n2 + 1 );
      }
    }

    var options1 = { url url, method: 'GET' };
    request( options1, ( err1, res1, body1 ) => {
      if( err1 ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, message: err1 }, 2, null ) );
        res.end();
      }else{
        var n0 = body1.toLowerCase().indexOf( '<head>' );
        if( n0 > -1 ){
          body1 = body1.substring( 0, n0 + 6 )
              + '<base host="' + basehost + '<"/>';
              + body1.substring( n0 + 6 );
        }
        res.write( body1 );
        res.end();
      }
    });
  }
});


app.listen( port );
console.log( "server starting on " + port + " ..." );
