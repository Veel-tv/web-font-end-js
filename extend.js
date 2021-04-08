

/**
 * [Deprecated] Save cookie that indicates that the user has already dismissed the welcome message
 *
 * @return null.
 */
function dismissWelcome() {
   localStorage.setItem("welcomeDismissed", "true");;
}

var torrentData;

/**
 * Gets veel/video from a given ID and rnders it to the header of the page (used for the home page and channel page)
 *
 * @param {String} Video ID.
 * @param {Bolean} Whether or not this is for the home page (FIXME: change this to seconds to skip and start from as this is what this is used for).
 * @return String.
 */
function loadHeaderVideo(vidId,isHome) {
var client = new WebTorrent();
  
  var currentResolution = 720;
  var currentPos = 0;
  var resumePlayOnLoad = false;
  var seedAllOptions = true; // Normally, Veel will check if all files are less than 500MB, if so, download all of them to help the network. But if user has limited internet, then we want to only download the selected quality file.
  var enableSeed = true; // Disable if user wants to save data (i.e on a mobile network plan)

//var vidId = "qo8d64";


    var url = "/api/video_info/?video="+vidId;
  var search_request = new XMLHttpRequest();
  search_request.onreadystatechange = function() {
    if (search_request.readyState == 4 && search_request.status == 200) {
        var videoInfo = JSON.parse(search_request.responseText);

        

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
          previewThumbnails: { enabled: true, src: '/video/testThumbs.vtt' },
          muted: true,
          volume: 0,
          quality: {
            default: 720,
            options: supported_qualities,
            forced: true,
            onChange: (e) => updateQuality(e)
          }
        });

        player.muted = true;
        //player.volume = 0;

        startPos = 0;

        if (isHome)
          startPos = 8.5;
        else
          player.poster = "/thumbnails/"+videoInfo[0].id+"_720.jpg";

        $("button[data-plyr='pip']").empty();
        $("button[data-plyr='pip']").append('<i class="fas fa-chevron-down"></i>');

        $("button[data-plyr='fullscreen']").empty();
        $("button[data-plyr='fullscreen']").append('<i class="far fa-square"></i>');

        $("button[aria-controls='plyr-settings-4709'].plyr__control").empty();
        $("button[aria-controls='plyr-settings-4709'].plyr__control").append('<i class="fas fa-cog"></i>');

        $(".plyr__control--overlaid").empty();
        $(".plyr__control--overlaid").append('<i class="fas fa-play-circle"></i>');
        //$("video").addClass("player-loading");
        
        /*setTimeout(function(){
          $("button[data-plyr='pip']").empty();
          $("button[data-plyr='pip']").append('<i class="fas fa-square"></i>');
      }, 2000);*/

      var justChanged = false;

player.on('playing', event => {
  if (!justChanged)
    player.currentTime = startPos;
  justChanged = true;
  setTimeout(function(){ justChanged = false; }, 3000);
})


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

player.on('pause', event => {
   player.play();
   player.currentTime = startPos;
});

    
        
        
        

        if (videoInfo.length == 1) {
          webseedsString = "";
          for (var i = 0; i < videoInfo[0].webseeds.length; i++) {
            webseedsString += "&ws="+videoInfo[0].webseeds[i];
          }
          
          var torrentId = videoInfo[0].magnet+"&xs=https://veel.tv/torrent-files/"+vidId+".torrent"+webseedsString;

            client.add(torrentId, function(torrent) {
    // Deselect all files on initial download
    console.log("torrent info: ",torrent);

    if (torrent.numPeers == 0) {
      //$("#live-vid-views").text("1  watching now")
    } else {
      //$("#live-vid-views").text(numberWithCommas(torrent.numPeers)+"  watching now")
    }

    torrent.on('wire', function (wire) {
      console.log("new peer");
    });
    

    if (seedAllOptions) {
      var totalFileSize = 0;
      torrent.files.forEach(file => totalFileSize += file.length);

      if (totalFileSize > 524288000) { // If out total file size is less than 500MB, lets help the decentralised network a bit.
        torrent.files.forEach(file => file.deselect());
        torrent.deselect(0, torrent.pieces.length - 1, false);
        console.log("too big, lets be efficient here");
      } else {
        console.log("we can help the veel network")
      }
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
      if (resumePlayOnLoad) {
        resumePlayOnLoad = false;
        console.log("currentPos: ",currentPos);
        //player.currentTime = currentPos;
        player.play();
        player.currentTime = startPos;
        //$("video").removeClass("player-loading");
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
        }

        }
    };
    search_request.open("GET", url, true);
    search_request.send();
}

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

function loadTopSubs() {

$("#recommendedChannels").removeClass("d-none");

  var url = "/top_subscribers/";
  var search_request = new XMLHttpRequest();
  search_request.onreadystatechange = function() {
    if (search_request.readyState == 4 && search_request.status == 200) {
        var sideSubs = JSON.parse(search_request.responseText);

        for (var i = 0; i < sideSubs.length; i++ ) {
            $("#side-subs-list").append('<li>'+
                     '<a href="/c/?u='+sideSubs[i].username+'">'+
                     '<img class="img-fluid" alt="" src="/profiles/'+sideSubs[i].username+'.jpg"> '+sideSubs[i].channel_name+
                     '</a>'+
                  '</li>');
        }
        
        if (sideSubs.length > 0)
            $(".channel-sidebar-list").removeClass("d-none");
    }
};
search_request.open("GET", url, true);
search_request.send();
}

/**
 * Abbreviates a large number into K (thousand) M (million) B (billion) T (trillion)
 *
 * @param {int} bytes to convert.
 * @return String.
 */
function copyToClipboard(text, el) {
  var elOriginalText = el.attr('data-original-title');
  var copyTextArea = document.createElement("textarea");
  $(copyTextArea).addClass("position-absolute");
  $(copyTextArea).addClass("copyTextArea");
    copyTextArea.value = text;
    document.body.appendChild(copyTextArea);
    copyTextArea.select();
try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'Copied!' : 'Whoops, not copied!';
      el.attr('data-original-title', msg).tooltip('show');
    } catch (err) {
      console.log('Oops, unable to copy');
    }

    document.body.removeChild(copyTextArea);
    el.attr('data-original-title', elOriginalText);
}

$(document).ready(function() {
  $('.js-tooltip').tooltip();
  // Copy to clipboard
  // Grab any text in the attribute 'data-copy' and pass it to the 
  // copy function
  $('.js-copy').click(function() {
    var text = $(this).attr('data-copy');
    var el = $(this);
    copyToClipboard(text, el);
  });

  $('#top_bar .nav-item').on('show.bs.dropdown', function () {
        $("#top_bar").addClass("sub-menu-shown");
    });

    $('#top_bar .nav-item').on('hide.bs.dropdown', function () {
        $("#top_bar").removeClass("sub-menu-shown");
    });
});

loadTopSubs();

