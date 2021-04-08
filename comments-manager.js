//TODO check for connection or update if error occurs. We are not waiting for server response to improve user experience.

var validAttachment;

/**
 * Save comment submitted by the current user to the veel server
 *
 * @param {object} Comment object.
 * @return Object.
 */
var saveComment = function(data) {
   // Convert pings to human readable format
   $(Object.keys(data.pings)).each(function(index, userId) {
      var fullname = data.pings[userId];
      var pingText = '@' + fullname;
      data.content = data.content.replace(new RegExp('@' + userId, 'g'), pingText);
   });
   console.log("replied data: ",data);
   var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
        console.log("responseA: ",xhr.responseText);
        var res = JSON.parse(xhr.responseText);
        if (res.err) {
           data = false;
        } else {
           data.id = res.id;
        }
        
        if (validAttachment != null)
         uploadAttatchment(validAttachment);
         
    }
}
    xhr.open("POST", "/api/post_comment/index.php?video="+vidId, false); //FIXME: Don't use index.php
    let form_data = new FormData();
    let stringified_data = JSON.stringify(data);
    form_data.append('data', stringified_data);
    xhr.send(form_data);
    
    console.log("replied data: ",data);
   return data;
}

/**
 * Upload attachment submitted by the user (images)
 *
 * @param {File} FIle to upload.
 * @return null.
 */
function uploadAttatchment(fileToUpload) {
   var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
       if (xhr.readyState == XMLHttpRequest.DONE) {
          console.log("response: ",xhr.responseText);
      }
   }
    xhr.open("POST", "/upload_attachment.php", false); 
   var form_data = new FormData();
   form_data.append('attatchment', fileToUpload.file);
   console.log("fileToUpload: ",fileToUpload);
   xhr.send(form_data);
   //FIXME: return error if failed to upload or errors given out by the server
}


/**
 * Save edited comment submitted by the current user to the veel server
 *
 * @param {object} Comment object.
 * @return Object.
 */
var editComment = function(data) {
   var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
        console.log("response: ",xhr.responseText);  
    }
}
    xhr.open("POST", "/api/edit_comment/index.php?video="+vidId, false); //FIXME: Don't use index.php
    let form_data = new FormData();
    let stringified_data = JSON.stringify(data);
    form_data.append('data', stringified_data);
    xhr.send(form_data);
   return data;
}

/**
 * Delete comment that was submitted by the current user from the veel server
 *
 * @param {object} Comment object.
 * @return Object.
 */
function deleteComment(data) {
   var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
        console.log("response: ",xhr.responseText);  
    }
}
    xhr.open("POST", "/api/delete_comment/index.php", false); //FIXME: Don't use index.php
    let form_data = new FormData();
    form_data.append('video_id', vidId);
    form_data.append('comment_id', data.id);
    xhr.send(form_data);
   return data;
}

/**
 * Gets comments for the current (given) veel/video and appends them to the page
 *
 * @param {String} Video ID.
 * @return null.
 */
function getComments(vidId) {
   var url = "/api/get_comments?video="+vidId;
            var search_request = new XMLHttpRequest();
            search_request.onreadystatechange = function() {
                if (search_request.readyState == 4 && search_request.status == 200) {
                    //handle response
                    var commentsData = JSON.parse(search_request.responseText);

                    var commentsArray = commentsData.comments;
                    var usersArray = commentsData.users;

                    console.log("commentsData: ",commentsData);
                    console.log("users: ",usersArray);

                    

                  //currentUserId: 1,
                  
                  $('#comments-container').comments({
                     profilePictureURL: commentsData.profile_image,
                     roundProfilePictures: true,
                     textareaRows: 1,
                     readOnly: !commentsData.can_edit,
                     enableAttachments: true,
                     enableHashtags: true,
                     enablePinging: true,
                     currentUserIsAdmin: false,
                     scrollContainer: $(window),
                     searchUsers: function(term, success, error) {
                        setTimeout(function() {
                           success(usersArray.filter(function(user) {
                              var containsSearchTerm = user.fullname.toLowerCase().indexOf(term.toLowerCase()) != -1;
                              var isNotSelf = user.id != 1;
                              return containsSearchTerm && isNotSelf;
                           }));
                        }, 500);
                     },
                     getComments: function(success, error) {
                        setTimeout(function() {
                           success(commentsArray);
                        }, 500);
                     },
                     postComment: function(data, success, error) {
                        setTimeout(function() {
                           success(saveComment(data));
                        }, 500);
                     },
                     putComment: function(data, success, error) {
                        console.log("edit: ",data);
                        setTimeout(function() {
                           success(editComment(data));
                        }, 500);
                     },
                     deleteComment: function(data, success, error) {
                        console.log("delete: ",data);
                        setTimeout(function() {
                           success(deleteComment(data));
                        }, 500);
                     },
                     upvoteComment: function(data, success, error) {
                        console.log("upvote: ",data);
                        setTimeout(function() {
                           success(editComment(data));
                        }, 500);
                     },
                     validateAttachments: function(attachments, callback) {
                        console.log("attachments: ",attachments);
                        setTimeout(function() {
                           
                           $(attachments).each(function(index, attachment) {
                              var maxFileSizeMb = 5;
                              var fileSizeMb = attachment.file.size / 1000000;
                              if(fileSizeMb <= maxFileSizeMb) {
                                 validAttachment = attachment;
                                 //validAttachments.push(attachment);
                              } else {
                                 //show error
                              }
                           });
                           callback(attachments);
                        }, 500);
                     },
                  });

                  if (commentsArray.length > 1) {
                     var noOfCommentsString = commentsArray.length+" Comments";
                  } else if (commentsArray.length  == 1) {
                     var noOfCommentsString = "1 Comment";
                  } else {
                     var noOfCommentsString = "No Comments";
                  }
                  
                  $("ul.navigation").append('<div><span id="noOfComments" style="font-weight: bold;">'+noOfCommentsString+'</span><span> • </span><span id="selectedCommentsOrder">Newest</span> <div class="dropdown d-inline-block float-right">'+
                  '<button class="btn btn-secondary dropdown-toggle dropdown-btn" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">'+
                  'Sort by'+
                  '</button>'+
                  '<div class="dropdown-menu" aria-labelledby="dropdownMenuButton">'+
                  '<a class="dropdown-item" onclick="sortCommentsBy(0);event.preventDefault();" href="">Newest</a>'+
                  '<a class="dropdown-item" onclick="sortCommentsBy(1);event.preventDefault();" href="">Oldest</a>'+
                  '<a class="dropdown-item" onclick="sortCommentsBy(2);event.preventDefault();" href="">Popular</a>'+
                  '</div>'+
                  '</div>'+
                  '</div>');

                  //$(".textarea-wrapper input[type='file']").attr("type","image");
                    
                }
            };
    search_request.open("GET", url, true);
    search_request.send();
}

/**
 * Changes the order in which he comments are displayed pn the page based on the given option
 *
 * @param {int} Selected sorting option.
 * @return null.
 */
function sortCommentsBy(option) {
   switch(option) {
      case 0:
         $('li[data-sort-key="newest"]').click();
         $("#selectedCommentsOrder").text("Newest");
         break;
      case 1:
         $('li[data-sort-key="oldest"]').click();
         $("#selectedCommentsOrder").text("Oldest");
         break;
      case 2:
         $('li[data-sort-key="popularity"]').click();
         $("#selectedCommentsOrder").text("Popular");
         break;
   }
}
var url_string = window.location.href
var url = new URL(url_string);
var vidId = url.searchParams.get("v");
if (vidId != "") {
   getComments(vidId);
}