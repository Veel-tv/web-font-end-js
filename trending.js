
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
 * GETs trending Veels/videos from the Veel servers and appends them based on the returned results.
 *
 * @return null.
 */
function getTrendingVeels() {
    var url = "/api/get_trending";
  var search_request = new XMLHttpRequest();
  search_request.onreadystatechange = function() {
    if (search_request.readyState == 4 && search_request.status == 200) {
        var suggestedVideos = JSON.parse(search_request.responseText);

        for (var i = 0; i < suggestedVideos.length; i++) {

          if (suggestedVideos[i].views == 0) {
          var vidViews = "No views";
        } else if (suggestedVideos[i].views == 1) {
          var vidViews = suggestedVideos[i].views+" view";
        } else {
          var vidViews = abbreviateNumber(suggestedVideos[i].views)+" views";
        }

        console.log("getting suggestion: ",suggestedVideos[i]);

          $("#trendingVideoList").append('<div class="video-card video-card-list">'+
                                    '<div class="video-card-image">'+
                                       '<a class="play-icon" href="/video?v='+suggestedVideos[i].id+'"><i class="fas fa-play-circle"></i></a>'+
                                       '<a href="/video?v='+suggestedVideos[i].id+'"><img class="img-fluid" src="../thumbnails/'+suggestedVideos[i].id+'_thumbnail.jpg" alt=""></a>'+
                                       '<div class="time">'+toHHMMSS(suggestedVideos[i].length)+'</div>'+
                                    '</div>'+
                                    '<div class="video-card-body">'+
                                       '<div class="btn-group float-right right-action">'+
                                          '<a href="../#" class="right-action-link text-gray" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">'+
                                          '<i class="fa fa-ellipsis-v" aria-hidden="true"></i>'+
                                          '</a>'+
                                          '<div class="dropdown-menu dropdown-menu-right">'+
                                             '<a class="dropdown-item" href="#"><i class="fas fa-fw fa-star"></i> &nbsp; Add to playlist</a>'+
                                          '</div>'+
                                       '</div>'+
                                       '<div class="video-title">'+
                                          '<a href="/video?v='+suggestedVideos[i].id+'">'+suggestedVideos[i].title+'</a>'+
                                       '</div>'+
                                       '<div class="video-page">'+
                                        '<a title="" class="text-success" data-placement="top" data-toggle="tooltip" href="../#" data-original-title="Verified">'+suggestedVideos[i].uploader[0].channel_name+'<i class="fas fa-user-check text-success"></i></a>'+
                                       ' • <a style="color: #ffffff;" href="/video?v='+suggestedVideos[i].id+'">'+vidViews+' &nbsp;<i class="fas fa-calendar-alt"></i> '+suggestedVideos[i].uploaded_time+'</a>'+
                                       '</div>'+
                                       '<div class="video-description"><a class="description-overlay" href="/video?v='+suggestedVideos[i].id+'"></a>'+
                                          suggestedVideos[i].description+
                                       '</div>'+
                                    '</div>'+
                                 '</div>');
        }
        $("body").fadeIn();

        }
    };
    search_request.open("GET", url, true);
    search_request.send();
  }

  getTrendingVeels();