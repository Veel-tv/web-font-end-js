var url_string = window.location.href
var url = new URL(url_string);
var searchQuery = url.searchParams.get("q");
console.log("searchQuery: ",searchQuery);

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
 * GETs search results from the user query from the Veel servers and appends the Veel(s) and Channel(s) from the returned results
 *
 * @return null.
 */
  function getSearchResults() {
    var url = "/api/search/?q="+searchQuery;
  var search_request = new XMLHttpRequest();
  search_request.onreadystatechange = function() {
    if (search_request.readyState == 4 && search_request.status == 200) {
      console.log("search_request.responseText: ",search_request.responseText);
        var searchResults = JSON.parse(search_request.responseText);

        console.log("suggestedVideos: ",searchResults);

        for (var i = 0; i < searchResults.videos.length; i++) {

     if (searchResults.videos[i].views == 0) {
          var vidViews = "No views";
        } else if (searchResults.videos[i].views == 1) {
          var vidViews = searchResults.videos[i].views+" view";
        } else {
          var vidViews = abbreviateNumber(searchResults.videos[i].views)+" views";
        }

        var doesChannelAlreadyExist = searchResults.channels.filter(function (el) { return el.username == searchResults.videos[i].uploader[0].username;});

        if (doesChannelAlreadyExist.length == 0) {
          searchResults.channels.push(searchResults.videos[i].uploader[0]);
        }

      
          //Append a recommended Channel
          $("#videosResults").append('<div class="col-xl-3 col-sm-6 mb-3">'+
                        '<div class="video-card">'+
                           '<div class="video-card-image">'+
                              '<a class="play-icon" href="/video?v='+searchResults.videos[i].id+'"><i class="fas fa-play-circle"></i></a>'+
                              '<a href="/video?v='+searchResults.videos[i].id+'"><img class="img-fluid" src="/thumbnails/'+searchResults.videos[i].id+'_thumbnail.jpg" alt=""></a>'+
                              '<div class="time">'+toHHMMSS(searchResults.videos[i].length)+'</div>'+
                           '</div>'+
                           '<div class="video-card-body">'+
                              '<div class="video-title">'+
                                '<a href="/video?v='+searchResults.videos[i].id+'">'+searchResults.videos[i].title+'</a>'+
                              '</div>'+
                              '<div class="video-page text-success">'+
                                 searchResults.videos[i].uploader[0].channel_name+'  <a title="" data-placement="top" data-toggle="tooltip" href="#" data-original-title="Verified"><i class="fas fa-user-check text-success"></i></a>'+
                              '</div>'+
                              '<div class="video-view">'+
                                 vidViews+' &nbsp;<i class="fas fa-calendar-alt"></i> '+searchResults.videos[i].uploaded_time+
                              '</div>'+
                           '</div>'+
                        '</div>'+
                     '</div>');
        }

        for (var i = 0; i < searchResults.channels.length; i++) {
          if (searchResults.channels[i].subscribers > 1) {
            var subString = searchResults.channels[i].subscribers+" Subscribers";
          } else if (searchResults.channels[i].subscribers == 1) {
            var subString = "1 Subscriber";
          } else {
            var subString = "No Subscribers";
          }
          $("#channelResults").append('<div class="col-md-2">'+
                           '<div class="item">'+
                              '<div class="category-item">'+
                                 '<a href="#">'+
                                    '<img class="img-fluid" src="../profiles/'+searchResults.channels[i].username+'.jpg" alt="">'+
                                    '<h6>'+searchResults.channels[i].channel_name+'</h6>'+
                                    '<p>'+subString+'</p>'+
                                 '</a>'+
                              '</div>'+
                           '</div>'+
                     '</div>');
        }

        if (searchResults.videos.length == 0 && searchResults.channels.length == 0 ) {
          $(".video-block").addClass("d-none");
          $("#emptyResults").removeClass("d-none");
        }
        $("body").fadeIn();

        }
    };
    search_request.open("GET", url, true);
    search_request.send();
  }

  if (searchQuery != "") {
    getSearchResults();

} else {
  console.log("apprently empty");
  $(".video-block").addClass("d-none");
  $("#emptyResults").removeClass("d-none");
  $("body").fadeIn();
  //FIXME: show error message here about invalid video or something
   //Then fade in $("body").fadeIn();
}








  