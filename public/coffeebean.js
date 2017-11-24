
//. jQuery をこの前にロードしておく
if( !jQuery ){
  console.log( 'jQuery needed to be loaded.' );
}

//. GA tag ID のようなもの。うまく取得できない・・・
var search = $(location).attr( 'search' ); //location.search;
var key = null;
//console.log( search );
if( search ){
  var params = search.substring( 1 ).split( '&' );
  for( var i = 0; i < params.length && key == null; i ++ ){
    var tmp = params[i].split( '=' );
    if( tmp[0] == 'key' ){
      key = tmp[1];
    }
  }
}

var cookie_name = 'coffeebean_id';
var default_expire_days = 7;
var href, ua, referrer;

$(function(){
  //. ロード時に記録
  href = location.href;
  ua = navigator.userAgent;
  referrer = document.referrer;

  var id = getId();
  var param = {
    key: key,
    user_id: id,
    type: 'load',
    body: {
      url: href,
      userAgent: ua,
      referrer : referrer
    }
  };
  postActivity( param );

  //. <a> タグのリンクをクリックしたら記録
  $('a').click( function(){
    var target = $(this).prop( 'href' );
    var id = getId();
    var param = {
      key: key,
      user_id: id,
      type: 'click_a',
      body: {
        url: href,
        href: target,
        userAgent: ua,
        referrer : referrer
      }
    };
    postActivity( param );
  });

  //. スクロールしたら記録
  $(window).scroll( function(){
    var id = getId();
    var scroll_top = $(this).scrollTop();
    var param = {
      key: key,
      user_id: id,
      type: 'scroll',
      body: {
        url: href,
        top: scroll_top,
        userAgent: ua,
        referrer : referrer
      }
    };
    postActivity( param );

    //. ページの最後までみたら記録
    var scrollHeight = $(document).height();
    var scrollPosition = $(window).height() + $(window).scrollTop();
    if( ( scrollHeight - scrollPosition ) / scrollHeight === 0 ){
      var param = {
        user_id: id,
        //datetime: dt,
        type: 'scroll_bottom',
        body: {
          url: href,
          userAgent: ua,
          referrer : referrer
        }
      };
      postActivity( param );
    }
  });
});

function postActivity( param ){
  var href = location.href;
  var url = '';
  var n1 = href.indexOf( '//' );
  if( n1 > -1 ){
    var n2 = href.indexOf( '/', n1 + 2 );
    if( n2 > -1 ){
      url = href.substring( 0, n2 + 1 ) + 'activity';
    }
  }else{
    var n2 = href.indexOf( '/' );
    if( n2 > -1 ){
      url = href.substring( 0, n2 + 1 ) + 'activity';
    }
  }

  //console.log( 'url = ' + url ); //. http://localhost:xxxx/activity
  if( param && url ){
    console.log( param );
    $.ajax({
      type: 'POST',
      url: 'https://coffeebean.au-syd.mybluemix.net/activity',
      data: param
    }).done( function( result ){
      console.log( result );
    });
  }
}

function getId(){
  var id = null;
  
  var cookies = document.cookie.split( ';' );
  for( var i = 0; i < cookies.length && id == null; i ++ ){
    var pair = cookies[i].trim().split( '=' );
    if( pair.length > 1 && pair[0] == cookie_name ){
      id = pair[1];
    }
  }
  
  if( id == null ){
    id = generateId();
  }

  setId( id );

  return id;
}

function generateId(){
  //. https://github.com/GoogleChrome/chrome-platform-analytics/blob/master/src/internal/identifier.js
  //. const FORMAT: string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  let chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split( '' );
  for( let i = 0, len = chars.length; i < len; i++ ){
    switch( chars[i] ){
      case "x":
        chars[i] = Math.floor( Math.random() * 16 ).toString( 16 );
        break;
      case "y":
        chars[i] = ( Math.floor( Math.random() * 4 ) + 8 ).toString( 16 );
        break;
    }
  }

  return chars.join( '' );
}

function setId( id ){
  setId( id, default_expire_days );
}
function setId( id , days ){
  if( id ){
    document.cookie = cookie_name + '=' +  id + ';max-age=' + ( 24 * 3600 * days );
  }
}

function getDatetime(){  //. 未使用
  var dt = new Date();
  var y = dt.getFullYear();
  var m = dt.getMonth() + 1;
  var d = dt.getDate();
  var h = dt.getHours();
  var n = dt.getMinutes();
  var s = dt.getSeconds();

  var ymdhns = y + '-' + ( m < 10 ? '0' : '' ) + m + '-' +  ( d < 10 ? '0' : '' ) + d + ' ' + ( h < 10 ? '0' : '' ) + h + ':' + ( n < 10 ? '0' : '' ) + n + ':' + ( s < 10 ? '0' : '' ) + s;

  return ymdhns;
}



