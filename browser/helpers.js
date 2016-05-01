/**************************************************************************** 
 * Aux functions, mostly UI-related
 ****************************************************************************/



// function snapPhoto() {
//     canvas.drawImage(video, 0, 0, canvasWidth, canvasHeight);
//     show(photo, sendBtn);
// }

// function sendPhoto() {
//     // Split data channel message in chunks of this byte length.
//     var CHUNK_LEN = 64000;

//     var img = canvas.getImageData(0, 0, canvasWidth, canvasHeight),
//         len = img.data.byteLength,
//         n = len / CHUNK_LEN | 0;

//     console.log('Sending a total of ' + len + ' byte(s)');
//     dataChannel.send(len);

//     // split the photo and send in chunks of about 64KB
//     for (var i = 0; i < n; i++) {
//         var start = i * CHUNK_LEN,
//             end = (i+1) * CHUNK_LEN;
//         console.log(start + ' - ' + (end-1));
//         dataChannel.send(img.data.subarray(start, end));
//     }

//     // send the reminder, if any
//     if (len % CHUNK_LEN) {
//         console.log('last ' + len % CHUNK_LEN + ' byte(s)');
//         dataChannel.send(img.data.subarray(n * CHUNK_LEN));
//     }
// }

// function snapAndSend() {
//     snapPhoto();
//     sendPhoto();
// }

// function renderPhoto(data) {
//     var photo = document.createElement('canvas');
//     photo.classList.add('photo');
//     trail.insertBefore(photo, trail.firstChild);

//     var canvas = photo.getContext('2d');
//     img = canvas.createImageData(300, 150);
//     img.data.set(data);
//     canvas.putImageData(img, 0, 0);
// }

// function setCanvasDimensions() {
//     if (video.videoWidth == 0) {
//         setTimeout(setCanvasDimensions, 200);
//         return;
//     }
    
//     console.log('video width:', video.videoWidth, 'height:', video.videoHeight)

//     canvasWidth = video.videoWidth / 2;
//     canvasHeight = video.videoHeight / 2;
//     //photo.style.width = canvasWidth + 'px';
//     //photo.style.height = canvasHeight + 'px';
//     // TODO: figure out right dimensions
//     canvasWidth = 300; //300;
//     canvasHeight = 150; //150;
// }

// function show() {
//     Array.prototype.forEach.call(arguments, function(elem){
//         elem.style.display = null;
//     });
// }

// function hide() {
//     Array.prototype.forEach.call(arguments, function(elem){
//         elem.style.display = 'none';
//     });
// }

// function randomToken() {
//     return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
// }

