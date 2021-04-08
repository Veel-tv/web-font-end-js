
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
 * Load top subscribed channels. FIXME: Change this to recommended channels especially if user is logged in
 *
 * @param {int} bytes to convert.
 * @return String.
 */
function loadTopSubs() {

$("#recommendedChannels").removeClass("d-none");

  var url = "/top_subscribers/";
  var search_request = new XMLHttpRequest();
  search_request.onreadystatechange = function() {
    if (search_request.readyState == 4 && search_request.status == 200) {
        var topSubs = JSON.parse(search_request.responseText);

        
  if (topSubs.length != 0) {
    $("#recommendedChannels").removeClass("d-none");
  }
  for (var i = 0; i < topSubs.length; i++) {
    
    var subString = abbreviateNumber(topSubs[i].subscribers)+" subscribed";
    var subIndicator = abbreviateNumber(topSubs[i].subscribers);
    if (topSubs[i].subscribers == 0) {
      subString = "No subscribers";
      subIndicator = "";
    }
      
          //Append a recommended Channel
          $("#recommendedChannels > .row").append('<div class="col-xl-2 col-sm-6 mb-3">'+
                        '<div class="channels-card">'+
                           '<div class="channels-card-image">'+
                              '<a href="/c/?u='+topSubs[i].username+'"><img class="img-fluid" src="profiles/'+topSubs[i].username+'.jpg" alt=""></a>'+
                              '<div class="channels-card-image-btn"><button type="button" class="btn btn-outline-danger btn-sm">Subscribe <strong>'+subIndicator+'</strong></button></div>'+
                           '</div>'+
                           '<div class="channels-card-body">'+
                              '<div class="channels-title">'+
                                 '<a href="#">'+topSubs[i].channel_name+'</a>'+
                              '</div>'+
                              '<div class="channels-view">'+
                                 subString+
                              '</div>'+
                           '</div>'+
                        '</div>'+
                     '</div>');
        }


      }
    };
    search_request.open("GET", url, true);
    search_request.send();
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
 * Gets the list of featured videos/veels from the Veel servers and appends them to the page
 *
 * @return null.
 */
  function loadLoadFeaturedVideos() {

  var url = "/api/featured_videos/";
  var search_request = new XMLHttpRequest();
  search_request.onreadystatechange = function() {
    if (search_request.readyState == 4 && search_request.status == 200) {
        var featuredVideos = JSON.parse(search_request.responseText);

        console.log("featuredVideos: ",featuredVideos);

  for (var i = 0; i < featuredVideos.length; i++) {

     if (featuredVideos[i].views == 0) {
          var vidViews = "No views";
        } else if (featuredVideos[i].views == 1) {
          var vidViews = featuredVideos[i].views+" view";
        } else {
          var vidViews = abbreviateNumber(featuredVideos[i].views)+" views";
        }
    
      
          //Append a recommended Channel
          $("#featuredVideos").append('<div class="col-xl-3 col-sm-6 mb-3">'+
                        '<div class="video-card">'+
                           '<div class="video-card-image">'+
                              '<a class="play-icon" href="/video?v='+featuredVideos[i].id+'"><i class="fas fa-play-circle"></i></a>'+
                              '<a href="/video?v='+featuredVideos[i].id+'"><img class="img-fluid" src="thumbnails/'+featuredVideos[i].id+'_thumbnail.jpg" alt=""></a>'+
                              '<div class="time">'+toHHMMSS(featuredVideos[i].length)+'</div>'+
                           '</div>'+
                           '<div class="video-card-body">'+
                              '<div class="video-title">'+
                                '<a href="/video?v='+featuredVideos[i].id+'">'+featuredVideos[i].title+'</a>'+
                              '</div>'+
                              '<div class="video-page text-success">'+
                                 featuredVideos[i].uploader[0].channel_name+'  <a title="" data-placement="top" data-toggle="tooltip" href="#" data-original-title="Verified"><i class="fas fa-user-check text-success"></i></a>'+
                              '</div>'+
                              '<div class="video-view">'+
                                 vidViews+' &nbsp;<i class="fas fa-calendar-alt"></i> '+featuredVideos[i].uploaded_time+
                              '</div>'+
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

  loadTopSubs();
  loadLoadFeaturedVideos();
  if (localStorage.getItem("welcomeDismissedB") != null)
    $(".home-top-bar").remove();
  else
   loadHeaderVideo("qpjt88",true);



  /*

  var tempTopSubs = '[{"username":"anesu","channel_name":"Anesu","verified":"1","subscribers":"1"},{"username":"music_videos","channel_name":"Music Videos","verified":"1","subscribers":"0"}]';
  var topSubs = JSON.parse(tempTopSubs);

  console.log("topSubs",topSubs)

  

  if (topSubs.length != 0) {
    $("#recommendedChannels").removeClass("d-none");
  }
  for (var i = 0; i < topSubs.length; i++) {
    
    var subString = topSubs[i].subscribers+" subscribed";
    var subIndicator = topSubs[i].subscribers;
    if (topSubs[i].subscribers == 0) {
      subString = "No subscribers";
      subIndicator = "";
    }
      
          //Append a recommended Channel
          $("#recommendedChannels > .row").append('<div class="col-xl-3 col-sm-6 mb-3">'+
                        '<div class="channels-card">'+
                           '<div class="channels-card-image">'+
                              '<a href="#"><img class="img-fluid" src="profiles/'+topSubs[i].username+'.jpg" alt=""></a>'+
                              '<div class="channels-card-image-btn"><button type="button" class="btn btn-outline-danger btn-sm">Subscribe <strong>'+subIndicator+'</strong></button></div>'+
                           '</div>'+
                           '<div class="channels-card-body">'+
                              '<div class="channels-title">'+
                                 '<a href="#">'+topSubs[i].channel_name+'</a>'+
                              '</div>'+
                              '<div class="channels-view">'+
                                 subString+
                              '</div>'+
                           '</div>'+
                        '</div>'+
                     '</div>');
  }*/

//$(".sidebar").addClass("toggled");