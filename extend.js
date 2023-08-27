
var autoplayNextVideo = true;
const allVeelsAutoCompleteResults = [];
var videoInfo;
var vidIds = "";
if (localStorage.getItem("autoplayNextVideo") != null) {
  if (localStorage.getItem("autoplayNextVideo") === 'false') {
    autoplayNextVideo = false;
    $("#autoplayCheck").prop("checked", false);
  }
}
function escapeHtml(unsafe)
{
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

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

vidIds = vidId;


    var url = "/api/video_info/?video="+vidId;
  var search_request = new XMLHttpRequest();
  search_request.onreadystatechange = function() {
    if (search_request.readyState == 4 && search_request.status == 200) {
        videoInfo = JSON.parse(search_request.responseText);

        if (isHome) {
          //https://skynetpro.net/AAATodwWMljtYo_zxMa4wbETs8IeM8GOyXS4ykRLxHGUIg
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
      player.muted = true;
      player.mute = true;
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
            webseedsString += "&ws="+videoInfo[0].webseeds[i].replace(".siasky.net",".siasky.net");
          }
          
          var torrentId = videoInfo[0].magnet+"&xs=https://veel.tv/torrent-files/"+vidId+".torrent"+webseedsString;

          if (useTorrent) {

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

} else {
  

  //player.src = videoInfo[0].webseeds[i].replace(".siasky.net",".eu-ger-6.siasky.net")+"/"+vidId+"/"+currentResolution_tmp+".mp4";
  let sources = [];
  for (var i = 0; i < videoInfo[0].webseeds.length; i++) {
    sources.push({
      src: videoInfo[0].webseeds[i].replace(".siasky.net",".siasky.net")+"/"+vidId+"/"+currentResolution+".mp4",
        type: 'video/mp4',
        size: currentResolution,
    })
  }
  player.source = {
    type: 'video',
    title: 'Veel',
    sources: sources,
  }

  player.mute = true,
  player.volume = 0,

  
$("button[data-plyr='pip']").empty();
$("button[data-plyr='pip']").append('<i class="fas fa-chevron-down"></i>');

$("button[data-plyr='fullscreen']").empty();
$("button[data-plyr='fullscreen']").append('<i class="far fa-square"></i>');

$("button[aria-controls='plyr-settings-4709'].plyr__control").empty();
$("button[aria-controls='plyr-settings-4709'].plyr__control").append('<i class="fas fa-cog"></i>');

$(".plyr__control--overlaid").empty();
$(".plyr__control--overlaid").append('<i class="fas fa-play-circle"></i>');

//$("video").addClass("player-loading");
$("video").css("width","");
//$("video").removeAttr("controls");



}
        }

        }
    };
    search_request.open("GET", url, true);
    search_request.send();
}

function updateQuality(newQuality) {
    
    console.log("q changed: ",newQuality);
    currentResolution = newQuality;
    
    if (useTorrent) {
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

  }  else {
    //player.src = videoInfo[0].webseeds[i].replace(".siasky.net",".eu-ger-6.siasky.net")+"/"+vidId+"/"+currentResolution+".mp4";
    let sources = [];
        for (var i = 0; i < videoInfo[0].webseeds.length; i++) {
          sources.push({
            src: videoInfo[0].webseeds[i].replace(".siasky.net",".eu-ger-6.siasky.net")+"/"+vidIds+"/"+currentResolution+".mp4",
              type: 'video/mp4',
              size: currentResolution,
          })
        }
        /*player.source = {
          type: 'video',
          title: 'Veel',
          sources: sources,
        }*/
  }



  }
  console.log("A log")


  function join(t, a, s) {
    function format(m) {
       let f = new Intl.DateTimeFormat('en', m);
       return f.format(t);
    }
    return a.map(format).join(s);
 }

  ///api/check-subscription

  function checkIfSubscribed() {
    var url = "https://payments.veel.tv/api/check-subscription";
  var search_request = new XMLHttpRequest();
  search_request.withCredentials = true
  search_request.onreadystatechange = function() {
    if (search_request.readyState == 4 && search_request.status == 200) {
        var isSPlusUser = JSON.parse(search_request.responseText);

        console.log("isSPlusUser: ",isSPlusUser)

        if (isSPlusUser.ok) {
          if (isSPlusUser.subscribed) {          
           /*let a = [{day: 'numeric'}, {month: 'long'}, {year: 'numeric'}];
           let s = join(new Date(isSPlusUser.nextSubscriptionDate), a, ' ');
           $("#veelPlusNextBillingDate").text(s);
           $("#subAmount").text(`${isSPlusUser.symbol}${isSPlusUser.amount}`)
           $("#veelerLevel").text(isSPlusUser.userLevel);
           $(".veel-plus-features-list").empty();
            console.log("isSPlusUser.userLevelPermissions: ",isSPlusUser.userLevelPermissions);

            isSPlusUser.userLevelPermissions.forEach(permission => {
              console.log("appending ....: ",$(".veel-plus-features-list"))
              $(".veel-plus-features-list").append(`<li>${permission}</li>`)
            });*/
          } else {
            $("#getPlusStatusBtn").removeClass("d-none");
            $("#veelPlusOption").addClass("d-none");
            $(".veel-plus-features-list").empty();

            
          }
        }
    }
};
search_request.open("GET", url, true);
search_request.send();
  }

  function getMyPlaylists(isLibrary) {
    var url = "/api/get_user_playlists_full";
    var search_request = new XMLHttpRequest();
    search_request.onreadystatechange = async function () {
        if (search_request.readyState == 4 && search_request.status == 200) {
            var suggestedVideos = JSON.parse(search_request.responseText);
            myPlaylists = suggestedVideos;
            

            if (isLibrary) {
              if (myPlaylists.length) {
                console.log("remove no playlist")
                $(".no-playlists").remove();
             }
              $("#playlistVideoList").append(`<div id="playlistList" class="col-md-12"></div>`)
            } else {
              $("#myPlaylistsOptions > .form-check").empty();
            }
            const libraryItemsElement = isLibrary ? $("#playlistList") : $("#myPlaylistsOptions > .form-check");
            
            console.log("myPlaylists: ", myPlaylists)


            for (var i = 0; i < suggestedVideos.length; i++) {

                //const playlistId = 1;
                const playsText = `${suggestedVideos[i].views > 1 || suggestedVideos[i].views === 0 ? suggestedVideos[i].views + " plays" : suggestedVideos[i].views + " play"}`;
                const totalVeelsInPlaylist = `${suggestedVideos[i].videos.length > 1 || suggestedVideos[i].videos.length === 0 ? suggestedVideos[i].videos.length + " veels" : suggestedVideos[i].videos.length + " veel"}`;
                const playlistLikes = `${suggestedVideos[i].likes > 1 || suggestedVideos[i].likes === 0 ? suggestedVideos[i].likes + " likes" : suggestedVideos[i].likes + " like"}`;

                $("#no-playlist-info").addClass("d-none");
                libraryItemsElement.append(`
                               <div id="plylistOuter${suggestedVideos[i].id}"${isLibrary ? ' data-toggle="modal" data-target="#playlist-modal" onclick="openPlaylist('+i+')"' : ''}>
                               <div id="playlist${suggestedVideos[i].id}Loader" class="spinner-border d-none" style="height: 1.5em; width: 1.5em;" role="status">
                               <span class="sr-only">Loading...</span>
                               </div>
                               <input class="form-check-input" type="checkbox" value="" id="playlist${suggestedVideos[i].id}Item" ${suggestedVideos[i].videos.find(veel => veel === vidId) ? "checked" : ""}>
                               <label class="form-check-label" for="playlist${suggestedVideos[i].id}Item">
                               <div onclick="addRemoveToFromPlaylist(&quot;${suggestedVideos[i].id}&quot;,&quot;${vidId}&quot;)" class="video-card video-card-list ${vidId === suggestedVideos[i].id ? "selected" : ""}">` +
                    '<div class="video-card-image">' +
                    `${suggestedVideos[i].videos.length === 0 ? `<i id="playlist${i}EmptyIcon" class="fas fa-star-half" style="font-size: 100px;position: absolute; right: -55px;"></i>` : ''}` +
                    `<img id="playlistThumbImg${i + 1}" style="width: ${suggestedVideos[i].videos.length === 1 ? '100%;' : '50%;'}" class="img-fluid ${suggestedVideos[i].videos.length > 0 ? "" : "d-none"}" src="/thumbnails/${suggestedVideos[i].videos[0]}_thumbnail.jpg" alt="">` +
                    `<img id="playlistThumbImg${i + 2}" style="width: 50%;" class="img-fluid ${suggestedVideos[i].videos.length > 1 ? "" : "d-none"}" src="/thumbnails/${suggestedVideos[i].videos[1]}_thumbnail.jpg" alt="">` +
                    `<img id="playlistThumbImg${i + 3}" style="width: 50%;" class="img-fluid  ${suggestedVideos[i].videos.length > 2 ? "" : "d-none"}" src="/thumbnails/${suggestedVideos[i].videos[2]}_thumbnail.jpg" alt="">` +
                    `<img id="playlistThumbImg${i + 3}" style="width: 50%;" class="img-fluid  ${suggestedVideos[i].videos.length > 3 ? "" : "d-none"}" src="/thumbnails/${suggestedVideos[i].videos[3]}_thumbnail.jpg" alt="">` +
                    '<div id="playlistTotalVeels-' + suggestedVideos[i].id + '" class="time">' + totalVeelsInPlaylist + '</div>' +
                    '</div>' +
                    '<div class="video-card-body">' +
                    '<div class="btn-group float-right right-action" onclick="openContextMenuPlaylist()">' +
                    '<a href="javascript:void(0);" class="right-action-link text-gray" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                    '<i class="fa fa-ellipsis-v" aria-hidden="true"></i>' +
                    '</a>' +
                    '<div class="dropdown-menu dropdown-menu-right">' +
                    `<a class="dropdown-item" href="javascript:void(0);" onclick="event.stopPropagation(); deletePlaylist(&quot;${suggestedVideos[i].id}&quot;)"><i class="fas fa-trash"></i> &nbsp; Delete playlist</a>` +
                    '</div>' +
                    '</div>' +
                    '<div class="video-title">' +
                    '<div>' + suggestedVideos[i].title + '</div>' +
                    '</div>' +
                    '<div class="video-page text-success playlist-item-description">' +
                    `${suggestedVideos[i].description}}` +
                    '</div>' +
                    '<div class="video-view">' +
                    playsText + ' &nbsp;â€¢&nbsp; ' + playlistLikes +
                    '</div>' +
                    '</div>' +
                    '</div></label></div>');
            }
            $("#create-new-playlist-btn .spinner-border").addClass("d-none");
            hideNewPlaylistOptions();

            //$( "#playlistVideos" ).sortable();
        }
    };
    search_request.open("GET", url, true);
    search_request.send();
}

function loadTopSubs() {

//$("#recommendedChannels").removeClass("d-none");

  var url = "/top_subscribers/";
  var search_request = new XMLHttpRequest();
  search_request.onreadystatechange = function() {
    if (search_request.readyState == 4 && search_request.status == 200) {
        var sideSubs = JSON.parse(search_request.responseText);

        $(".veelers-results").empty();
        for (var i = 0; i < sideSubs.length; i++ ) {
            $(".side-subs-list").append('<li>'+
                     '<a href="/c/?u='+sideSubs[i].username+'">'+
                     '<img class="img-fluid" alt="" src="'+sideSubs[i].profile_img+'"> '+sideSubs[i].channel_name+
                     '</a>'+
                  '</li>');

                  $(".veelers-results").append(`<li><a href="/c/?u=${sideSubs[i].username}"><img class="img-fluid" alt="" src="${sideSubs[i].profile_img}"> ${sideSubs[i].channel_name}</a></li>`)
        }
        
        if (sideSubs.length > 0)
            $(".channel-sidebar-list").removeClass("d-none");
    }
};
search_request.open("GET", url, true);
search_request.send();
}

function abbreviateNumberNew(value) {
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

function deletePlaylist(playlistId) {
  const playlistItem = myPlaylists.find(playlist => playlist.id === playlistId);
  if (playlistItem) {
      $.post("/api/playlist/index.php", { discard: true, id: playlistId }, (fdbk, status) => {
          console.log("delete response: ", fdbk);
          console.log("delete response status: ", status);
          if (status == "success" && fdbk) {
              //$.snack("info", `Successfully deleted the "${playlistItem.title}" playlist`, 1000);
              $.snack("info", `Successfully deleted the "${playlistItem.title}" playlist`, 60000);
              $(`#plylistOuter${playlistId}`).remove();
              myPlaylists = myPlaylists.filter(playlist => playlist.id !== playlistId);
          } else {
              $.snack("error", `An error occured deleting the "${playlistItem.title}" playlist`, 5000);
          }

      })
  } else {
      $.snack("error", `An error occured deleting playlist`, 5000);
  }

}


function loadTrendingVeelsForSearch() {
  var url = "/api/get_trending";
var search_request = new XMLHttpRequest();
search_request.onreadystatechange = function() {
  if (search_request.readyState == 4 && search_request.status == 200) {
      var suggestedVideos = JSON.parse(search_request.responseText);

      $(".veels-results").empty();

      if (suggestedVideos.length) {
        $(".veels-search-title").text("Trending Veels");
      }

      for (var i = 0; i < (suggestedVideos.length > 4 ? 4 : suggestedVideos.length); i++) {

        if (suggestedVideos[i].views == 0) {
        var vidViews = "No views";
      } else if (suggestedVideos[i].views == 1) {
        var vidViews = suggestedVideos[i].views+" view";
      } else {
        var vidViews = abbreviateNumberNew(suggestedVideos[i].views)+" views";
      }

      console.log("getting suggestion: ",suggestedVideos[i]);

      const thumbnail = /*suggestedVideos[i].thumbnail !== "" ? `https://decentralised.veel.tv${suggestedVideos[i].thumbnail}` : */ `/thumbnails/${suggestedVideos[i].id}_thumbnail.jpg`
      //const thumbnail = `/thumbnails/${suggestedVideos[i].id}_thumbnail.jpg`

      console.log("final thumb: ",thumbnail)
      $(".veels-results").append(`<li><a href="/video?v=${suggestedVideos[i].id}"><img class="img-fluid" alt="" src="${thumbnail}"> <div class="search-result-detail"><p>${escapeHtml(suggestedVideos[i].title)}<p><small>${escapeHtml(suggestedVideos[i].uploader[0].channel_name)}</small></div></a></li>`)

        /*$("#trendingVideoList").append('<div class="video-card video-card-list col-md-12">'+
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
                                     `<a title="" class="text-success" data-placement="top" data-toggle="tooltip" href="../#" data-original-title="Verified">${suggestedVideos[i].uploader[0].channel_name} ${suggestedVideos[i].uploader[0].verified ? '<i style="margin-left: 2px;" class="fas fa-user-check text-success"></i>' : ''}</a>`+
                                     ' â€¢ <a style="color: #ffffff;" href="/video?v='+suggestedVideos[i].id+'">'+vidViews+' &nbsp; <span class="mobile-new-line"><span>â€¢</span> '+suggestedVideos[i].uploaded_time+'</span></a>'+
                                     '</div>'+
                                     '<div class="video-description"><a class="description-overlay" href="/video?v='+suggestedVideos[i].id+'"></a>'+
                                        suggestedVideos[i].description+
                                     '</div>'+
                                  '</div>'+
                               '</div>'); */
      }
      $("body").fadeIn();

      }
  };
  search_request.open("GET", url, true);
  search_request.send();
}

loadTrendingVeelsForSearch();
var hideTimeout;

$( "#search--veels-input" ).focusin(function() {
  clearTimeout(hideTimeout);
  $("#seach-suggestions").show();
});

$( "#search--veels-input" ).focusout(function() {
  hideTimeout = setTimeout(function(){ $("#seach-suggestions").hide(); }, 500);
  
});

$( "#mobile-search" ).focusin(function() {
  clearTimeout(hideTimeout);
  $("#mobile-header").hide();
  $("#seach-suggestions-mobile").show();
});

$( "#mobile-search" ).focusout(function() {
  hideTimeout = setTimeout(function(){ 
    $("#mobile-header").show();
  $("#seach-suggestions-mobile").hide();
  }, 500);
  
});

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

/*setTimeout(function(){
  $("button[data-plyr='pip']").empty();
  $("button[data-plyr='pip']").append('<i class="fas fa-square"></i>');
}, 2000);*/


$(document).ready(function() {


  $('#musicCategoriesModalBody :checkbox').change(function() {
    if ($("#musicCategoriesModalBody input[type=checkbox]:checked").length) {
      //allMusic

      let allMusicString = "music";

      $("#musicCategoriesModalBody input[type=checkbox]:checked").each(function() {
        allMusicString += ","+$(this).attr("name").replace("-category","");
      });
      
      $("#allMusic").val(allMusicString);
      //console.log("")
      console.log("there is at least 1 music category checked: ",$("#musicCategoriesModalBody input[type=checkbox]:checked"))
      $("input[name='music-category']").prop("checked",true);
    } else {
      $("input[name='music-category']").prop("checked",false);
      console.log("no music category checked.")
    }
    //console.log("lols")
    // do stuff here. It will fire on any checkbox change
  
  });
  


  console.log("triggered")
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

    if (localStorage.getItem('autoplay-disabled')) {
      $('.autoPlaySwitch').prop("checked", false);
    }


    $('.autoPlaySwitch').change(function() {
      if(this.checked) {
        localStorage.removeItem('autoplay-disabled');
      } else {
        localStorage.setItem('autoplay-disabled', true);
      }      
  });
});

loadTopSubs();
checkIfSubscribed();

function toggleSubscription(user,div) {
  $.ajax({type: 'GET', url: '/api/subscribe/?user='+user});
  if ($(div).text() === "Following") {
    $(div).text("Follow");
    //$(div).removeClass("subscribed");
  } else {
    $(div).text("Following");
    //$(div).addClass("subscribed");
  }
}

// Prevent capturing focus by the button.
$('button').on('mousedown', 
    /** @param {!jQuery.Event} event */ 
    function(event) {
        event.preventDefault();
    }
);

// Prevent capturing focus by the button.
$('a').on('mousedown', 
    /** @param {!jQuery.Event} event */ 
    function(event) {
        event.preventDefault();
    }
);

if ($("#autoplayCheck").length) {
  $("#autoplayCheck")[0].addEventListener('change', function () {
  autoplayNextVideo = $(this).is(":checked");
  localStorage.setItem("autoplayNextVideo", autoplayNextVideo);
}, false);
}

function toggleMobileSearch() {
  //$(".top-mobile-search").toggleClass("search-toggled");
  $("#mobile-search").focus();

}

closeModal = function () {
  $(".close").click();
}

var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
var eventer = window[eventMethod];
var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

// Listen to message from child window
eventer(messageEvent,function(e) {
  console.log("message recievd: ",e);
  if (e.data == "closePopup")
    $(".close").click();
    //run function//
},false);

console.log("extended is indeed loading");
document.domain = 'veel.tv';
closeAllModals = (subscribed) => {
  $(".close").click();
  console.log("subscribed: ",subscribed)
  if (subscribed) {
    $("#getPlusStatusBtn").addClass("d-none");
    $("#veelPlusOption").removeClass("d-none");
    checkIfSubscribed();
  }
}

signIn = () => {
  $(".close").click();
  window.location.href = "https://account.veel.tv/account/sign-in?redirect=dashboard";
}

loadModerationUserSeearch = () => {
  console.log("loading search data")
  const autocompleteResults = [];

  const veelIdx = "rc5dlx";
  /*autocompleteResults.push({
    id: veelIdx,
    label: "Test",
    veeler: "Anesu",
    img: ` /thumbnails/${veelIdx}_thumbnail.jpg`
  })*/

  /*users.forEach(user => {
    allUsersAutoComplete.push({
      id: user.username,
      value: `${user.full_name} (@${user.username})`,
      label: `${user.full_name} (@${user.username})`,
      img: `/profiles/${user.username}.jpg`
    })
    
  });*/
  //users-watching
  $("#search--veels-input").autocomplete({
    source: //"autocomplete.php",
    /*[
      {id:"John Doe",
       value:"John Doe",
       label:"John Doe",
       img:"http://images.maskworld.com/is/image/maskworld/bigview/john-doe-foam-latex-mask--mw-117345-1.jpg"},
      {id:"system Admin",
       value:"system Admin",
       label:"system Admin",
       img:"http://www.ericom.com/imgs/braftonArticles/3-things-every-system-admin-should-know-about-virtualization_16001411_800906167_0_14057272_500.jpg"}
    ],*/
    autocompleteResults,
    minLength: 1,
    select: function(event, ui) {
    },
    html: true, 
    open: function(event, ui) {
      $(".ui-autocomplete").css("z-index", 1000);

    }
  })
    .autocomplete( "instance" )._renderItem = function( ul, item ) {
    return $( `<li class="veel-search-result"><div><img src="${item.img}"><span>${item.label}</span></div><div><small>${item.veeler}</small></div></li>` ).appendTo( ul );
  };




  $("#mobile-search").autocomplete({
    source: //"autocomplete.php",
    /*[
      {id:"John Doe",
       value:"John Doe",
       label:"John Doe",
       img:"http://images.maskworld.com/is/image/maskworld/bigview/john-doe-foam-latex-mask--mw-117345-1.jpg"},
      {id:"system Admin",
       value:"system Admin",
       label:"system Admin",
       img:"http://www.ericom.com/imgs/braftonArticles/3-things-every-system-admin-should-know-about-virtualization_16001411_800906167_0_14057272_500.jpg"}
    ],*/
    autocompleteResults,
    minLength: 1,
    select: function(event, ui) {
      //selectedUserForModeration = ui.item.id;
      //selectedUserForModerationLabel = ui.item.label;
      //userAdded = true;
      //$("#add-moderator-btn").removeAttr("disabled");
      /*
      var url = ui.item.id;
      if(url != '') {
        location.href = '...' + url;
      }
      */
    },
    html: true, 
    open: function(event, ui) {
      $(".ui-autocomplete").css("z-index", 1000);

    }
  })
    .autocomplete( "instance" )._renderItem = function( ul, item ) {
    return $( `<li class="veel-search-result"><div><img src="${item.img}"><span>${item.label}</span></div><div><small>${item.veeler}</small></div></li>` ).appendTo( ul );
  };
}

loadModerationUserSeearch();

setTimeout(function(){
  var socket = io.connect("https://search-engine.veel.tv");
let searchReady = false;


socket.on('connect', () => {
  console.log('Successfully connected to search engine!');
  searchReady = true;
    /*socket.emit("init", {
      veelId: window.videoInfo[0].id,
      reconnecting: initd
    });*/
  
  

  
});

socket.on("search-result", function(data){
  console.log("search-result: ",data)
  if (data.veels.length) {
    $(".veels-search-title").text("Veels");
    $(".veels-results").empty();
    data.veels.forEach(veel => {
      veel.thumbnail = veel.thumbnail === "" ? `/thumbnails/${veel.stringified_id}_thumbnail.jpg` : veel.thumbnail;
      $(".veels-results").append(`<li><a href="/video?v=${veel.stringified_id}"><img class="img-fluid" alt="" src="${veel.thumbnail}"> <div class="search-result-detail"><p>${veel.title}<p><small>${veel.channel_name}</small></div></a></li>`)
      
    });
  }

  if (data.veelers.length) {
    $(".veelers-results").empty();
    data.veelers.forEach(veeler => {
      $(".veelers-results").append(`<li><a href="/c/?u=${veeler.username}"><img class="img-fluid" alt="" src="${veeler.thumbnail ? veeler.thumbnail : `https://decentralised.veel.tv/profiles/${veeler.username}.jpg`}"> ${veeler.channel_name}</a></li>`)
    });
  }

  //veel-suggestions-results

  if (data.suggestions && data.suggestions.length) {
    $(".veel-suggestions-results").empty();
    $(".veel-suggestions-results").show();
    for (var i = 0; i < (data.suggestions.length > 4 ? 4 : data.suggestions.length); i++) {
      //<li><a href="/search/?q=Music"><i class="fas fa-search"></i>  Music</a></li>
      $(".veel-suggestions-results").append(`<li><a href="/search/?q=${data.suggestions[i]}"><i class="fas fa-search"></i> ${data.suggestions[i]}</a></li>`);
    }
    
  }
  
});

$('#search--veels-input').on('input',function(e){
  if (searchReady) {
    socket.emit("search", {
      input: $('#search--veels-input').val()
    });
  }
  
 });

 $('#mobile-search').on('input',function(e){
  if (searchReady) {
    socket.emit("search", {
      input: $('#mobile-search').val()
    });
  }
  
 });
}, 4000);




 function openPaymentPage() {
   $(".veel-plus-benefits").addClass("d-none");
   $(".paymentsIframe").removeClass("d-none");
 }

 function openVeelPlusModal() {
  $(".paymentsIframe").addClass("d-none");
  $(".veel-plus-benefits").removeClass("d-none");
 }

function cancel_subscription() {
  var form_data = new FormData();
    var search_request = new XMLHttpRequest();
    search_request.onreadystatechange = function () {
       if (search_request.readyState == 4 && search_request.status == 200) {
          var deletedReponse = JSON.parse(search_request.responseText);
          console.log("deleted deletedReponse: ",deletedReponse);

          if (deletedReponse.ok) {
            window.location.href = "https://veel.tv/";
          }

       }
      }

  var url = `https://veel.tv/community-guidelines//api/cancel_subscription`;
       console.log("url: ",url)
       search_request.open("POST", url, true);
       search_request.withCredentials = true;
       search_request.send(form_data);
}

