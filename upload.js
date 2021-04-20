  var client = new WebTorrent();
  var currentStatus = "";
  var qualityOptions = [];
  var lasPerentage = 0;
  var processOriginalRes = false;
  var originalRes = {};
  var thumbnails = ['thumbnail','thumbnail_2','thumbnail_3']
  var selectedThumbnail = 0;
  var videoLength = 0;
  var supportedQualities = "";
  var videoFps = 0;

  var torrentData;

 const message = document.getElementById('message');


const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({
  log: false,
  progress: ({ ratio }) => {
    const stagePercentage = lasPerentage+((ratio * 100.0))/(qualityOptions.length);
    if (stagePercentage > 0) {
      $('.progress-bar').css('width', stagePercentage+'%').attr('aria-valuenow', stagePercentage);
      $(".base-size").text(`${currentStatus} ${Math.round(stagePercentage)}%`)
    }
    
    //message.innerHTML = `Complete: ${}%`;
  },
});

/**
 * The complete transoding pipeline. From determining the highest resolution of the video (and obtaining video metadata) to transcoding it to appropriate qualities.
 *
 * @param {Array} Array of Files (FIXME: Should be just 1 file to continue).
 * @return null.
 */
const transcode = async ({ target: { files } }) => {
MediaInfo({ format: 'object' }, async (mediainfo) => {
      const file = files[0];
      if (file) {
    message.innerHTML = 'Loading Media Metadata...';

    const getSize = () => file.size

    const readChunk = (chunkSize, offset) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target.error) {
            reject(event.target.error)
          }
          resolve(new Uint8Array(event.target.result))
        }
        reader.readAsArrayBuffer(file.slice(offset, offset + chunkSize))
      })

    mediainfo
      .analyzeData(getSize, readChunk)
      .then(async (result) => {
        console.log("ress: ",result);
        var thumbnailPos = result.media.track[0].Duration/3;
        var thumbnailPosB = result.media.track[0].Duration/4;
        var thumbnailPosC = result.media.track[0].Duration/2;
        videoLength = result.media.track[0].Duration;
        videoFps = result.media.track[0].FrameRate;

        for (var i = 0; i < result.media.track.length; i++) {
          console.log("result.media.track[i]['@type']: ",result.media.track[i]['@type']);
          if (result.media.track[i]['@type'] == "Video") {
            console.log("found video...");
            if (result.media.track[i].Sampled_Width > 720) { //Will support 4k in a bit. Fo now this means it's 1080p or close.
              if (result.media.track[i].Sampled_Width != 1080 && result.media.track[i].Sampled_Width < 1080) {
                //It's some weird resolution below 1080p so lets try to keep it to maintain aspect ratio, but label it as 1080p
                processOriginalRes = true;
                originalRes = {width: result.media.track[i].Sampled_Width, height: result.media.track[i].Sampled_Height};
              }
              qualityOptions = [1080,720,480];
              supportedQualities = "1080,720,480";
            } else if (result.media.track[i].Sampled_Width > 480) {
            if (result.media.track[i].Sampled_Width != 720 && result.media.track[i].Sampled_Width < 720) {
                //It's some weird resolution below 720 so lets try to keep it to maintain aspect ratio, but label it as 720
                processOriginalRes = true;
                originalRes = {width: result.media.track[i].Sampled_Width, height: result.media.track[i].Sampled_Height};
              }
              qualityOptions = [720,480];
              supportedQualities = "720,480";
          } else { //480p or below
            if (result.media.track[i].Sampled_Width != 480 && result.media.track[i].Sampled_Width < 480) {
                //It's some weird resolution below 480 (probs 360p or 240p in this case) so lets try to keep it to maintain aspect ratio, but label it as 480
                processOriginalRes = true;
                originalRes = {width: result.media.track[i].Sampled_Width, height: result.media.track[i].Sampled_Height};
              }
              qualityOptions = [480];
              supportedQualities = "480";
          }
        }
        }

        

  const { name } = files[0];
  $("#message-subtext").hide();
  message.innerHTML = 'Setting things up...';
  await ffmpeg.load();
  
  ffmpeg.FS('writeFile', name, await fetchFile(files[0]));
  $(".base-title").text(name);
  $("#e1").val(name.replace(/\.[^/.]+$/, ""));
  

  /*Generate main thumbnail*/
  message.innerHTML = 'Generating thumbnails...';
  await ffmpeg.run('-deinterlace','-an','-ss',String(thumbnailPos),'-i', name,'-preset','ultrafast','-f','mjpeg','-t','1','-r','1','-y','-s','640x360','thumbnail.jpg');
  const thumbnail_data = ffmpeg.FS('readFile', 'thumbnail.jpg');
  const thumbnail = document.getElementById('thumbnail');
  thumbnail.src = URL.createObjectURL(new Blob([thumbnail_data.buffer], { type: 'image/jpg' }));
  $("#thumbnail-option-0 > img").attr("src",thumbnail.src);

  await ffmpeg.run('-deinterlace','-an','-ss',String(thumbnailPos),'-i', name,'-preset','ultrafast','-f','mjpeg','-t','1','-r','1','-y','-s','1280x720','thumbnail_720.jpg');
  //const thumbnail_data_720 = ffmpeg.FS('readFile', 'thumbnail_720.jpg');
  
  await ffmpeg.run('-deinterlace','-an','-ss',String(thumbnailPosB),'-i', name,'-preset','ultrafast','-f','mjpeg','-t','1','-r','1','-y','-s','640x360','thumbnail_2.jpg');
  const thumbnail_data_b = ffmpeg.FS('readFile', 'thumbnail_2.jpg');
  $("#thumbnail-option-1 > img").attr("src",URL.createObjectURL(new Blob([thumbnail_data_b.buffer], { type: 'image/jpg' })));

  await ffmpeg.run('-deinterlace','-an','-ss',String(thumbnailPosC),'-i', name,'-preset','ultrafast','-f','mjpeg','-t','1','-r','1','-y','-s','640x360','thumbnail_3.jpg');
  const thumbnail_data_c = ffmpeg.FS('readFile', 'thumbnail_3.jpg');
  $("#thumbnail-option-2 > img").attr("src",URL.createObjectURL(new Blob([thumbnail_data_c.buffer], { type: 'image/jpg' })));
  

  $("#initial-upload-page").hide();
  $("#upload-details").removeClass("d-none");

      console.log("qualityOptions: ",qualityOptions);
      console.log("originalRes: ",originalRes);
      console.log("processOriginalRes: ",processOriginalRes);
      //$("#thumbnail").parent().show();
  
  for (var i = 0; i < qualityOptions.length; i++) {
    currentStatus = 'Stage '+(i+1)+' of '+(qualityOptions.length+2)+': Transcoding:';
    if (i == 0 && processOriginalRes)
      await ffmpeg.run('-i', name,'-preset','ultrafast','-vf','scale=-1:'+originalRes.height,  qualityOptions[i]+'.mp4');
    else
      await ffmpeg.run('-i', name,'-preset','ultrafast','-vf','scale=-1:'+qualityOptions[i],  qualityOptions[i]+'.mp4');

      /*if (i == 0 && processOriginalRes)
      await ffmpeg.run('-i', name,'-c:v','libx264','-preset','ultrafast','-vf','scale=-1:'+originalRes.height,  qualityOptions[i]+'.mp4');
    else
      await ffmpeg.run('-i', name,'-c:v','libx264','-preset','ultrafast','-vf','scale=-1:'+qualityOptions[i],  qualityOptions[i]+'.mp4');*/
    
    lasPerentage += 100/qualityOptions.length; 
    //currentStatus = 'Completed transcoding Stage '+(i+2)+':';
  }

  currentStatus = 'Stage '+(qualityOptions.length+1)+' of '+(qualityOptions.length+2)+': Generating previews (this might take a moment):';
  $(".base-size").text(currentStatus);
  await ffmpeg.run('-i', name,'-preset','ultrafast','-filter_complex',"select='not(mod(n,120))',scale=360:202.50,tile=11x11",'-frames:v','1','-qscale:v','3','-an','preview.jpg');
 //const previews_data = ffmpeg.FS('readFile', 'preview.jpg');
 //$("#thumbnail-option-2 > img").attr("src",URL.createObjectURL(new Blob([previews_data.buffer], { type: 'image/jpg' })));



 //console.log("vtt done here: ",vtt_data);

  $(".base-size").text('Waiting for you to save changes. Select "Save Changes" below to continue.');

  /*const finalStage = qualityOptions.length+1;
  $(".base-size").text('Stage '+finalStage+' of '+finalStage+': Broadcasting to peers');*/

  


  //const data = ffmpeg.FS('readFile', 'output.mp4');
 
  //const video = document.getElementById('output-video');
  //video.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));

  })
      .catch((error) => {
        console.log(`An error occured:\n${error.stack}`); //Show message box
      })
  }
});
  

      

      

      
    

  /*var files = [new File(data, "output2.mp4")];
  console.log("files: ",files)
  client.seed(files, function (torrent) {
    console.log('Client is seeding ' + torrent.magnetURI)
  })*/
};
//})

function selectThumbnailOptn(pos) {
  $(".selected-thumbnail img").removeClass("btn-outline-secondary");
  $(".selected-thumbnail").removeClass("selected-thumbnail");
  $("#thumbnail-option-"+pos).parent().addClass("selected-thumbnail");
  $("#thumbnail-option-"+pos+" img").addClass("btn-outline-secondary");
  $("#thumbnail").attr("src",$("#thumbnail-option-"+pos+" img").attr("src"));
  selectedThumbnail = pos;
}

function uploadVeels(veelId,files,token) {
  var form_data = new FormData();
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
        console.log("response: ",xhr.responseText);
        //var response = JSON.parse(xhr.responseText);
         
    }
}
xhr.open("POST", "/upload_veel/index.php", true); 
xhr.upload.addEventListener('progress', function(e){
  if(e.lengthComputable){
    var uploadPercent = e.loaded / e.total;
    uploadPercent = (uploadPercent * 100);
    console.log("upload percentage: ",uploadPercent);
  }
});

form_data.append('token', token);

console.log("files uploaded to server: ",files);

for (var i = 0; i < files.length; i++) {
  //files[i].path = veelId+"/"+files[i].path;
  form_data.append('fileToUpload[]', files[i]);
}
     //form_data.append('fileToUpload[]', fileObj);
xhr.send(form_data);
}

function startBroadcasting(veelId,token,vttData) {
   

  
  let files = [];
  //var Buffer = require('buffer');
  for (var i = 0; i < qualityOptions.length; i++) {
    let fileObj = new File([ffmpeg.FS('readFile', qualityOptions[i]+'.mp4')], qualityOptions[i]+'.mp4', {type: "video/mp4"});
    fileObj.isFile = true;
    fileObj.isDirectory = false;
    fileObj.fullPath = "/"+veelId+"/"+qualityOptions[i]+'.mp4';
    //fileObj.path = veelId+"/"+fileObj.path;
    files.push(fileObj);
  }

  const preview_data = ffmpeg.FS('readFile', "preview.jpg");
    const preview = new File([preview_data], "preview.jpg",{
      type: "image/jpg",
    });
    preview.isFile = true;
    preview.isDirectory = false;
    preview.fullPath = "/"+veelId+"/preview.jpg";
    files.push(preview);

    const vttFile = new File([vttData], "preview.vtt",{
      type: "text/plain",
    });
    vttFile.isFile = true;
    vttFile.isDirectory = false;
    vttFile.fullPath = "/"+veelId+"/preview.vtt";
    files.push(vttFile);

  //let files = ffmpeg.FS('readdir', '/');

  console.log("files: ",files);

  console.log("files to push: ",files);
 
  
  client.seed(files, function (torrent) {
    var totalFileSize = 0;
    console.log("seeding files: ",torrent.files);
      torrent.files.forEach(file => totalFileSize += file.length);
      totalFileSize = totalFileSize / Math.pow(1024,2);
    console.log('Client is seeding ' + torrent.magnetURI)
    //uploadMetadata(torrent.magnetURI,totalFileSize,files,torrent.torrentFile);
    uploadTorrentData(veelId,torrent.magnetURI,totalFileSize,token,torrent.torrentFile,files);
  })
}

function uploadTorrentData(veelId,magent,size,token,torrentFile,files) {
  var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        console.log("response: ",xhr.responseText);
        var response = JSON.parse(xhr.responseText);
        if (response.error == null) {
          uploadVeels(veelId,files,token);
      }
    }
    
    
}
xhr.open("POST", "/add_torrent_data/index.php", true); 
var form_data = new FormData();
form_data.append('token', token);
form_data.append('magnet', magent);
  form_data.append('torrentFile', new File([torrentFile], "torrentFile.torrent"));
  form_data.append('total_size', size);
xhr.send(form_data);
}

function uploadMetadata() {
  console.log("uploading..");
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
        console.log("response: ",xhr.responseText);
        var response = JSON.parse(xhr.responseText);
        console.log("JSON: ",JSON.parse(xhr.responseText));
        if (response.error == null) {
          var vtt_data = generate_vtt(videoLength,response.id,5,360,202.50,11);
          console.log("vtt_data: ",vtt_data);
          console.log("video url: https://veel.tv/video?v="+response.id);
          //uploadVeels(response.id,files,response.tokenId);
          startBroadcasting(response.id,response.tokenId,vtt_data);
          $(".base-close").hide();
          $(".base-size").text("Broadcasting your veel: 10%")
          $("#veelUrl").append('<a href="https://veel.tv/video?v='+response.id+'" target="_blank">https://veel.tv/video?v='+response.id+'</a>');
          $(".sharer").attr("data-url",'https://veel.tv/video?v='+response.id);
          $("#copyVeelUrl").attr('data-copy','https://veel.tv/video?v='+response.id);
          window.Sharer.init();
          $("#allProcessingOptions").addClass("d-none");
          $("#completedProcessing").removeClass("d-none");
        }
         
    }
}
    xhr.open("POST", "/uploader/index.php", true); 

    var form_data = new FormData();
    var submitData = true;

    if ($("#e1").val() == "") {
      //show error
      submitData = false;
    } else {
      form_data.append('title', $("#e1").val());
    }

    if ($("#e2").val() == "") {
      //show error
      submitData = false;
    } else {
      form_data.append('description', $("#e2").val());
    }

    form_data.append('privacy', $("#e4").val());
    //form_data.append('magnet', magent);
    //form_data.append('torrentFile', new File([torrentFile], "torrentFile.torrent"));
    form_data.append('length', videoLength);
    form_data.append('supported_qualities', supportedQualities);
    form_data.append('fps', videoFps);
    form_data.append('categories', '');
    form_data.append('age_restriction', $('#e3').find(":selected").text());
    form_data.append('tags', $('#e7').val());
    form_data.append('cast', $('#e8').val());
    form_data.append('monetized', $('#e5').find(":selected").text());
    form_data.append('intergrated_Ads', false);
    form_data.append('visibility', $('#e4').find(":selected").text());
    form_data.append('captions', '');
    //form_data.append('total_size', size);
    const thumbnail_data = ffmpeg.FS('readFile', thumbnails[selectedThumbnail]+".jpg");
    const thumbnail = new File([thumbnail_data], "thumbnail.jpg",{
      type: "image/jpg",
    });
    form_data.append('thumbnail', thumbnail);
    const thumbnail_lg_data = ffmpeg.FS('readFile', thumbnails[selectedThumbnail]+"_720.jpg");
    const thumbnail_lg = new File([thumbnail_data], "thumbnail_lg.jpg",{
      type: "image/jpg",
    });
    form_data.append('thumbnail_lg', thumbnail_lg);

    const preview_data = ffmpeg.FS('readFile', "preview.jpg");
    const preview = new File([preview_data], "preview.jpg",{
      type: "image/jpg",
    });
    form_data.append('preview', preview);


    


    //form_data.append('file', fileToUpload);
    xhr.send(form_data);

}


document.getElementById('uploader').addEventListener('change', transcode);