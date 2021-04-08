  var userData = [];


var url_string = window.location.href
var url = new URL(url_string);
var userId = url.searchParams.get("u");

/**
 * Abbreviates a large number into K (thousand) M (million) B (billion) T (trillion)
 *
 * @param {int} bytes to convert.
 * @return String.
 */
function abbreviateNumber(value) {
    var newValue = value;
    if (value >= 1000) {
        var suffixes = ["", "K", "M", "B","T"];
        var suffixNum = Math.floor( (""+value).length/3 );
        var shortValue = '';
        for (var precision = 2; precision >= 1; precision--) {
            shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
            var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
            if (dotLessShortValue.length <= 2) { break; }
        }
        if (shortValue % 1 != 0)  shortValue = shortValue.toFixed(1);
        newValue = shortValue+suffixes[suffixNum];
    }
    return newValue;
}

/**
 * split large numbers with commas
 *
 * @param {int} number to split.
 * @return String.
 */
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

  

/**
 * Converts time in seconds to HH:MM:SS
 *
 * @param {int} time in seconds.
 * @return String.
 */
var toHHMMSS = (secs) => {
    var sec_num = parseInt(secs, 10)
    var hours   = Math.floor(sec_num / 3600)
    var minutes = Math.floor(sec_num / 60) % 60
    var seconds = sec_num % 60

    return [hours,minutes,seconds]
        .map(v => v < 10 ? "0" + v : v)
        .filter((v,i) => v !== "00" || i > 0)
        .join(":")
}


/**
 * Gets public veels/videos that were uploaded by the owner of the channel inluding the header veel.
 *
 * @return null.
 */
  function getUserVideos() {
    var url = "/api/get_user_videos?u="+userId;
  var search_request = new XMLHttpRequest();
  search_request.onreadystatechange = function() {
    if (search_request.readyState == 4 && search_request.status == 200) {
        userData = JSON.parse(search_request.responseText);

        if (userData.header_type == "custom_video") {
          loadHeaderVideo(userData.header_media);
        }
        $("body").fadeIn();
        /*
        var userVideos = userData.videos;
        console.log("userVideos: ",userVideos);
        for (var i = 0; i < userVideos.length; i++) {

     if (userVideos[i].views == 0) {
          var vidViews = "No views";
        } else if (userVideos[i].views == 1) {
          var vidViews = userVideos[i].views+" view";
        } else {
          var vidViews = abbreviateNumber(userVideos[i].views)+" views";
        }
    
      
          //Append a recommended Channel
          $("#homeVideosList").append('<div class="col-xl-3 col-sm-6 mb-3">'+
                        '<div class="video-card">'+
                           '<div class="video-card-image">'+
                              '<a class="play-icon" href="/video?v='+userVideos[i].id+'"><i class="fas fa-play-circle"></i></a>'+
                              '<a href="/video?v='+userVideos[i].id+'"><img class="img-fluid" src="/thumbnails/'+userVideos[i].id+'_thumbnail.jpg" alt=""></a>'+
                              '<div class="time">'+toHHMMSS(userVideos[i].length)+'</div>'+
                           '</div>'+
                           '<div class="video-card-body">'+
                              '<div class="video-title">'+
                                '<a href="/video?v='+userVideos[i].id+'">'+userVideos[i].title+'</a>'+
                              '</div>'+
                              '<div class="video-page text-success">'+
                                 userData.channel_name+'  <a title="" data-placement="top" data-toggle="tooltip" href="#" data-original-title="Verified"><i class="fas fa-user-check text-success"></i></a>'+
                              '</div>'+
                              '<div class="video-view">'+
                                 vidViews+' &nbsp;<i class="fas fa-calendar-alt"></i> '+userVideos[i].uploaded_time+
                              '</div>'+
                           '</div>'+
                        '</div>'+
                     '</div>');
        }

        $("body").fadeIn();

        */

        }
    };
    search_request.open("GET", url, true);
    search_request.send();
  }

if (userId != "") {
  getUserVideos();
}






  