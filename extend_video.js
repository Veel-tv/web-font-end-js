var checkTimeout;
var completed = false;


function checkInfo() {
    if (!completed) {
        clearTimeout(checkTimeout);
        checkTimeout = setTimeout(function(){ 
            completed = true;
            var url = "/api/get_suggested_videos";
            var search_request = new XMLHttpRequest();
            search_request.onreadystatechange = function() {
                if (search_request.readyState == 4 && search_request.status == 200) {
                    //handle response
                    
                }
            };
    search_request.open("GET", url, true);
    search_request.send();
    }, 5000);
    }
    
}
