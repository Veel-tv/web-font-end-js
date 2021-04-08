
// function to convert second-based time to HH:MM:SS.xxxx format required for VTT compliance
// see https://www.w3.org/TR/webvtt1/#webvtt-timestamp
const _secondsToHRTime = function (time) {
  if (typeof time === 'number' && time >= 0) {
    let seconds = Math.floor(time % 60);
    let minutes = Math.floor(time * 1.0 / 60);
    let hours = 0;
    if (minutes > 59) {
      hours = Math.floor(time * 1.0 / 3600);
      minutes = Math.floor(((time * 1.0 / 3600) % 1) * 60);
      seconds = Math.floor(time % 60);
    }
    if (seconds < 10) {
      seconds = '0' + seconds;
    }
    if (minutes < 10) {
      minutes = '0' + minutes;
    }
    if (hours > 0) {
      hours = hours + ':';
    } else if (hours === 0) {
      hours = '';
    }
    return hours + minutes + ':' + seconds + '.000';
  } else {
    return '';
  }
};



function generate_vtt(duration,spriteFileLocation,gapBetweenFrames,thumbnailWidth,thumbnailHeight,tileSize) {
var vttData = ""
thumbnailHeight = parseInt(thumbnailHeight); //testing something. remove this
// append our initial VTT data for spec compliance
const initialData = 'WEBVTT' + '\n' + '\n';
vttData += initialData;

// initial variables values for our loop
const itemNumber = Math.floor(duration / gapBetweenFrames) + 1;
let currentTime = 0;
let xCoordinates = 0;
let yCoordinates = 0;
let thumbnailSizeString = ',' + thumbnailWidth + ',' + thumbnailHeight + '\n' + '\n';

// for each item append VTT data
for (let i = 0, len = itemNumber; i <= len; i++) {
  if (currentTime > duration) {
    break;
  }
  let startTime = _secondsToHRTime(currentTime);
  currentTime += gapBetweenFrames;
  let endTime = _secondsToHRTime(currentTime);
  if (!startTime || !endTime) {
    console.log('Error: could not determine startTime or endTime for VTT item number ' + i + ' - exit');
    return;
  }
  let string = startTime + ' --> ' + endTime + '\n';
  string += spriteFileLocation + '#xywh=' + xCoordinates + ',' + yCoordinates;
  string += thumbnailSizeString;
  xCoordinates += thumbnailWidth;
  if (xCoordinates > (thumbnailWidth * (tileSize - 1))) {
    yCoordinates += thumbnailHeight;
    xCoordinates = 0;
  }
  vttData += string;
}

return vttData;
}