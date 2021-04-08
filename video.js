  var client = new WebTorrent();
  var torrentData;
  var currentResolution = 720;
  var currentPos = 0;
  var resumePlayOnLoad = false;
  var seedAllOptions = true; // Normally, Veel will check if all files are less than 500MB, if so, download all of them to help the network. But if user has limited internet, then we want to only download the selected quality file.
  var enableSeed = true; // Disable if user wants to save data (i.e on a mobile network plan)
  var muted = false;
  var dedicatedSeedersCount = 4;

var url_string = window.location.href
var url = new URL(url_string);
var vidId = url.searchParams.get("v");
console.log("video id: ",vidId);

/**
 * Converts bytes to KB MB GB or TB depending on how many bytes provided
 *
 * @param {int} bytes to convert.
 * @return String.
 */
function bytesToSize(bytes) {
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   if (bytes == 0) return '0 Byte';
   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
   return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

if (vidId != "") {
    var url = "/api/video_info/?video="+vidId;
  var search_request = new XMLHttpRequest();
  search_request.onreadystatechange = function() {
    if (search_request.readyState == 4 && search_request.status == 200) {
        var videoInfo = JSON.parse(search_request.responseText);

        console.log("videoInfo: ",videoInfo);

        //console.log("captions: ",JSON.parse(videoInfo[0].captions));
        var captions = JSON.parse(videoInfo[0].captions);

        for (var i = 0; i < captions.length; i++) {
          $("#player").append('<track kind="captions" label="'+captions[i].language+'" src="/captions/'+captions[i].id+'/'+videoInfo[0].id+'.vtt" srclang="'+captions[i].id+'" />');
        }

        var supported_qualities = videoInfo[0].supported_qualities.split(",");

        for(var i=0; i< supported_qualities.length;i++)
          supported_qualities[i] = parseInt(supported_qualities[i], 10);

        if (videoInfo[0].supported_qualities.indexOf(currentResolution) == -1) {
          var currentResolution_tmp = supported_qualities[supported_qualities.length-1];
        } else {
          var currentResolution_tmp = currentResolution;
        }

        console.log("supported_qualities: ",supported_qualities);
        console.log("currentResolution_tmp: ",currentResolution_tmp);


        
        const player = new Plyr('#player', {
          debug: false,
          previewThumbnails: { enabled: true, src: '/previews/'+videoInfo[0].id+'_preview.vtt' },
          quality: {
            default: 720,
            options: supported_qualities,
            forced: true,
            onChange: (e) => updateQuality(e)
          }
        });

        if (!muted)
          player.muted = false;
          

        player.poster = "/thumbnails/"+videoInfo[0].id+"_720.jpg";

        $("button[data-plyr='pip']").empty();
        $("button[data-plyr='pip']").append('<i class="fas fa-chevron-down"></i>');

        $("button[data-plyr='fullscreen']").empty();
        $("button[data-plyr='fullscreen']").append('<i class="far fa-square"></i>');

        $("button[aria-controls='plyr-settings-4709'].plyr__control").empty();
        $("button[aria-controls='plyr-settings-4709'].plyr__control").append('<i class="fas fa-cog"></i>');

        $(".plyr__control--overlaid").empty();
        $(".plyr__control--overlaid").append('<i class="fas fa-play-circle"></i>');

        $("video").addClass("player-loading");

        
        /*setTimeout(function(){
          $("button[data-plyr='pip']").empty();
          $("button[data-plyr='pip']").append('<i class="fas fa-square"></i>');
      }, 2000);*/


  $("body").fadeIn();

    player.on('loadstart', event => {
    console.log("player is ready");
    /*Fixes bug where if a user clicked play too early (before it loaded) it would get stuck on "loading" mode*/
    player.pause();
    player.play();
});

  player.on('waiting', event => {
    
    /*Fixes bug where user changes quality and it gets stuck on loading*/

    if (currentPos == player.currentTime) {
      player.currentTime--;
      var lastCurrentPos = player.currentTime;
      currentPos = 0;


      setTimeout(function(){ 
        //One more attempt
        if (lastCurrentPos == player.currentTime) {
          player.currentTime--;
          currentPos = 0;
        }
      }, 2000);
    }
      
});

var startedPlaying = false;
var firstAttemptToPlay = true;
var retryPlay;

player.on('playing', event => {
  $("video").removeAttr("controls");
  if (currentPos != 0)
  player.currentTime = currentPos;
  checkInfo();
  player.volume = player.volume;

  if (firstAttemptToPlay) {
    firstAttemptToPlay = false;
    player.currentTime = 10; //fixing a bug where the video just doesn't play
    setTimeout(function(){ player.currentTime = 0; }, 100);
    retryPlay = setInterval(function(){
      
      console.log("retry to play...")
    player.pause(); 
    setTimeout(function(){ player.play(); }, 100);
    }, 1000);
    //setTimeout(function(){ player.currentTime = 0; }, 1000); //fixing a bug where the video just doesn't play
  } else {
    var checkIfPlaying = player.currentTime;
    setTimeout(function(){ 
      if (player.currentTime != checkIfPlaying) {
        console.log("successfully playing...")
        clearInterval(retryPlay);
      }
     }, 500);
  }
  

  console.log("on play: ")
  $("video").removeClass("player-loading");
  var totalViewers = (torrentData.numPeers - dedicatedSeedersCount) + 1;
  $("#live-vid-views").text(totalViewers+"  Watching now ("+(torrentData.numPeers)+" peers)");
    

  console.log("num of peers: ",torrentData.numPeers)
});

setInterval(function(){ 
  var totalViewers = (torrentData.numPeers - dedicatedSeedersCount) + 1;
  $("#live-vid-views").text(totalViewers+"  Watching now ("+(torrentData.numPeers)+" peers)");
     }, 10000);

player.on('pause', event => {
    console.log("pos: ",player.currentTime)
   console.log("num of peers: ",torrentData.numPeers);
   console.log("num of ratio: ",torrentData.ratio);
   console.log("num of progress: ",torrentData.progress);
   console.log("torrent.path: ",torrentData.path);
   console.log("torrent.piecesLength: ",torrentData.pieceLength);
   console.log("torrent.lastPieceLength: ",torrentData.lastPieceLength);
   console.log("client.downloadSpeed: ",bytesToSize(client.downloadSpeed));
});

$("video").removeAttr("controls");
//$("video").css("width","100%");

        console.log("videoInfo: ",videoInfo);

        $("#title").text(videoInfo[0].title);
        $("title").text(videoInfo[0].title+" - Veel");

        if (videoInfo[0].views == 0) {
          $("#vid-views").text("No views");
        } else if (videoInfo[0].views == 1) {
          $("#vid-views").text(videoInfo[0].views+" view");
        } else {
          $("#vid-views").text(numberWithCommas(videoInfo[0].views)+" views");
        }


        $("#uploaderName").text(videoInfo[0].uploader[0].channel_name);
        $("#channelThumbnail").attr("src","../profiles/"+videoInfo[0].uploader[0].username+".jpg");
        $("#video-description").empty();
        $("#video-description").append(videoInfo[0].description);

        if (videoInfo[0].cast == "") {
          $(".cast-option").addClass("d-none");
        } else {
          $("#cast-list").empty();
          //$("#cast-list").append(videoInfo[0].cast);
          $("#cast-list").append('<div class="cast-item"><img src="https://www.refinery29.com/images/8587843.jpg?format=webp&width=720&height=864&quality=85"><div class="cast-details"><h6>Valerie Broussard</h6><small>Singer</small><a href="#"><i class="fab fa-twitter"></i> Twitter </a><a href="#"><i class="fab fa-instagram"></i> Instagram </a></div></div>')
        }

        if (videoInfo[0].categories == "") {
          $(".category-item").addClass("d-none");
        } else {
          $("#categories").text(videoInfo[0].category);
        }

        if ($("#cast-list").hasClass("d-none") && $("#categories").hasClass("d-none"))
          $("#aboutTitle").addClass("d-none");

          if (videoInfo[0].uploader[0].subscribers != 0)
            $("#subscriptionsCounter").text(abbreviateNumber(videoInfo[0].uploader[0].subscribers));

        var tags = videoInfo[0].tags.split(",");

        if (tags.length == 0) {
          $(".tags-item").addClass("d-none");
        }

        console.log("split tags: ",tags);

        for (var i = 0; i < tags.length; i++) {
          $("#description-tags").append('<span><a href="../#">'+tags[i]+'</a></span>');
        }

        //var uploadTime = new Date(videoInfo[0].upload_time);
        var uploadTime = moment(videoInfo[0].upload_time, "YYYY-MM-DD").format('ll');

        console.log("uploadTime: ",uploadTime);

        //console.log("uploadTimeB: ",uploadTimeB);

        
        /*const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(uploadTime);
        const mo = new Intl.DateTimeFormat('en', { month: 'short' }).format(uploadTime);
        const da = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(uploadTime);
        $("#uploadTime").text(`Published on ${mo} ${da}, ${ye}`);*/
        $("#uploadTime").text(`Published on ${uploadTime}`);
        
        
        

        if (videoInfo.length == 1) {
          var torrentId = videoInfo[0].magnet+"&xs=https://veel.tv/torrent-files/"+vidId+".torrent&ws=https://ws-au.veel.tv/ws/&ws=https://ws-us.veel.tv/ws/&ws=https://externos.io/veel/ws/&ws=https://veel.tv/ws/";
          //https://veel.tv/ws/

          client.processing = true;

          //setTimeout(function(){
            console.log("magnet: ",torrentId);

            console.log("listening for errors now..");
            client.on('error', function (err) {
              console.log("Failed to download media because: ",err);
            })

            client.add(torrentId, function(torrent) {
    // Deselect all files on initial download
    console.log("torrent info: ",torrent);
    

    var totalViewers = (torrent.numPeers - dedicatedSeedersCount) + 1;
  $("#live-vid-views").text(totalViewers+"  Watching now ("+(torrent.numPeers)+" peers)");

    torrent.on('wire', function (wire) {
      console.log("new peer");
      var totalViewers = (torrent.numPeers - dedicatedSeedersCount) + 1;
      $("#live-vid-views").text(totalViewers+"  Watching now ("+(torrent.numPeers)+" peers)");
    });
    

    if (seedAllOptions) {
      var totalFileSize = 0;
      torrent.files.forEach(file => totalFileSize += file.length);

      /*if (totalFileSize > 524288000) { // If out total file size is less than 500MB, lets help the decentralised network a bit.
        torrent.files.forEach(file => file.deselect());
        torrent.deselect(0, torrent.pieces.length - 1, false);
        console.log("too big, lets be efficient here");
      } else {
        console.log("we can help the veel network")
      }*/
    } else {
      torrent.files.forEach(file => file.deselect());
      torrent.deselect(0, torrent.pieces.length - 1, false);
    }
    

    console.log("files found: ",torrent.files);
    torrentData = torrent;
    var file = torrent.files.find(function(file) {
      return file.name.indexOf(currentResolution_tmp) == 0;
    });

    torrent.on('download', function (bytes) {
      $("video").css("width","");
      $("video").removeAttr("controls");
      if (resumePlayOnLoad) {
        resumePlayOnLoad = false;
        console.log("currentPos: ",currentPos);
        //player.currentTime = currentPos;
        player.play();
        player.currentTime = 10; //fixing a bug where the video just doesn't play
        setTimeout(function(){ player.currentTime = 0; }, 1000); //fixing a bug where the video just doesn't play
        console.log('started', torrent.magnetURI);
        //player.currentTime = currentPos;
        //setTimeout(function(){ player.play(); player.currentTime = currentPos; }, 1000);

      }
})



    
    console.log("file found: ",file);
    file.renderTo('video', {
      autoplay: false,
      muted: true
    }, function callback() {
      console.log("ready to play!");
      
    });
    resumePlayOnLoad = true;
  });

  //}, 20000);
        }

        }
    };
    search_request.open("GET", url, true);
    search_request.send();
} else {
  //FIXME: show error message here about invalid video or something
   //Then fade in $("body").fadeIn();
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
 * split large numbers with commas
 *
 * @param {int} number to split.
 * @return String.
 */
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Changes the video quality to the provided video quality
 *
 * @param {int} video quality to change to (i.e 2160,1080,720,480).
 * @return null.
 */
  function updateQuality(newQuality) {
    
    console.log("q changed: ",newQuality);
    currentResolution = newQuality;
    
    if (torrentData != null) {
      player.pause();
      currentPos = player.currentTime;
      
      if (!seedAllOptions) {
        // Deselect all files on initial download
        torrentData.files.forEach(file => file.deselect());
        torrentData.deselect(0, torrentData.pieces.length - 1, false);
      }

      var file = torrentData.files.find(function(file) {
      return file.name.indexOf(currentResolution) == 0;
    });

    console.log("file found B: ",file);
    resumePlayOnLoad = true;
    file.renderTo('video', {
      autoplay: false,
      muted: true
    }, function callback() {
      console.log("ready to play!");
    });
    
    }
  }
  console.log("A log")

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
 * Gets sugguested videos froom the Veel servers and append them on the page
 *
 * @return null.
 */
  function getSuggestedVideos() {
    var url = "/api/get_suggested_videos?v="+vidId;
  var search_request = new XMLHttpRequest();
  search_request.onreadystatechange = function() {
    if (search_request.readyState == 4 && search_request.status == 200) {
        var suggestedVideos = JSON.parse(search_request.responseText);
        console.log("getting suggestion: ",suggestedVideos);
        for (var i = 0; i < suggestedVideos.length; i++) {

          if (suggestedVideos[i].views == 0) {
          var vidViews = "No views";
        } else if (suggestedVideos[i].views == 1) {
          var vidViews = suggestedVideos[i].views+" view";
        } else {
          var vidViews = abbreviateNumber(suggestedVideos[i].views)+" views";
        }

        

          $("#suggestedVideos").append('<div class="video-card video-card-list">'+
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
                                             '<a class="dropdown-item" href="../#"><i class="fas fa-fw fa-star"></i> &nbsp; Add to playlist</a>'+
                                          '</div>'+
                                       '</div>'+
                                       '<div class="video-title">'+
                                          '<a href="/video?v='+suggestedVideos[i].id+'">'+suggestedVideos[i].title+'</a>'+
                                       '</div>'+
                                       '<div class="video-page text-success">'+
                                          suggestedVideos[i].uploader[0].channel_name+'  <a title="" data-placement="top" data-toggle="tooltip" href="../#" data-original-title="Verified"><i class="fas fa-user-check text-success"></i></a>'+
                                       '</div>'+
                                       '<div class="video-view">'+
                                          vidViews+' &nbsp;<i class="fas fa-calendar-alt"></i> '+suggestedVideos[i].uploaded_time+
                                       '</div>'+
                                    '</div>'+
                                 '</div>');
        }

        }
    };
    search_request.open("GET", url, true);
    search_request.send();
  }

getSuggestedVideos();






  