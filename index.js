// Initiate object to store access token
var config = {};
config.access_token = prompt("Please enter the access token to proceed");

// Initiate object to store current image id, json objects containing image information, image ids and image tags.
var browserState = {};
browserState.currentImageId;
browserState.browserHistory = [];
browserState.browserHistoryImgId = [];
browserState.imageTags = [];

window.addEventListener("keydown", function (event) {
  if (event.keyCode === 37) {
    event.preventDefault();
    navigateLeft();
  } else if (event.keyCode === 39) {
    event.preventDefault();
    navigateRight();
  }
}, true);

var getImages = function(ifNext) {
  $.ajax({
    type: 'GET',
    dataType: 'jsonp',
    data: {},
    url: 'https://api.instagram.com/v1/media/popular?access_token=' + config.access_token,
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('error');
        console.log(jqXHR)
    },  
    success: function (resp) {
      processReqResponse(resp.data, ifNext);
    }
  });
};
getImages(true);


var processReqResponse = function(responseData, ifNext) {
  for (var i = 0 ; i < responseData.length; i++) {
    for(var j = 0 ; j < responseData[i].tags.length; j++) {
      if(browserState.imageTags.indexOf(responseData[i].tags[j]) < 0) {
        browserState.imageTags.push(responseData[i].tags[j]);
      }
    }

    if(browserState.browserHistoryImgId.indexOf(responseData[i].id) < 0) {
      if(ifNext) {
        browserState.browserHistoryImgId.push(responseData[i].id);
        browserState.browserHistory.push(responseData[i]);        
      } else {
        browserState.browserHistoryImgId.unshift(responseData[i].id);
        browserState.browserHistory.unshift(responseData[i]);        
      }
    }
  }
  browserState.currentImageId = browserState.currentImageId || browserState.browserHistoryImgId[0];
  if((browserState.browserHistoryImgId[browserState.browserHistoryImgId.length-1] === browserState.currentImageId && ifNext) || ((browserState.browserHistoryImgId[0] === browserState.currentImageId) && !ifNext)) {
    if(browserState.browserHistoryImgId.length < 50) {
      getImages(ifNext);
      return;
    } else {
      var newTag = browserState.imageTags.shift();
      getImagesByTag(newTag, ifNext);      
      return;
    }
  } 

  var currentLocation = browserState.browserHistoryImgId.indexOf(browserState.currentImageId);
  if(ifNext) {
    currentLocation += 1;
  } else {
    if(currentLocation > 0) {
      currentLocation -= 1;
    } else {
      console.error('no previous picture! press next to see more');
    };
  }
  renderImages(browserState.browserHistory[currentLocation]);
  browserState.currentImageId = browserState.browserHistoryImgId[currentLocation];
}

var getImagesByTag = function(tag, ifNext) {
  if(tag) {
    $.ajax({
      type: 'GET',
      dataType: 'jsonp',
      data: {},
      url: 'https://api.instagram.com/v1/tags/' + tag + '/media/recent?access_token=' + config.access_token + '&count=100',
      error: function (jqXHR, textStatus, errorThrown) {
        console.log('error');
          console.log(jqXHR)
      },
      success: function (resp) {
        resp.data;
        processReqResponse(resp.data, ifNext);
      }
    });
  } else {
    console.error('not a valid tag!');
  }
}

var filterComment = function(comment) {
  var commentArr = comment.split(' ');
  for (var i = 0; i < commentArr.length; i++) {
    if(commentArr[i][0].charCodeAt() === 240) {
      commentArr.splice(i, 1);
    }
  }
  return commentArr.join(' ');
}

var navigateRight = function() {
  if(browserState.browserHistoryImgId[browserState.browserHistory.length-1] === browserState.currentImageId) {
    getImages(true);
  } else {
    var index = browserState.browserHistoryImgId.indexOf(browserState.currentImageId);
    browserState.currentImageId = browserState.browserHistoryImgId[index+1];
    renderImages(browserState.browserHistory[index+1]);
  }
}

var navigateLeft = function() {
  if(browserState.browserHistoryImgId[0] === browserState.currentImageId) {
    getImages(false);
  } else {
    var index = browserState.browserHistoryImgId.indexOf(browserState.currentImageId);
    browserState.currentImageId = browserState.browserHistoryImgId[index-1];
    renderImages(browserState.browserHistory[index-1]);
  }
}

var renderImages = function(dataObject) {
  document.getElementById('image_user_name').innerHTML = dataObject.user.username;
  document.getElementById('image_time').innerHTML = moment(JSON.parse(dataObject.created_time+'000')).fromNow();
  document.getElementById('image_display_link').src = dataObject.images.standard_resolution.url;
  document.getElementById('image_instagram_link').setAttribute('href', dataObject.link);
  if(!dataObject.caption) {   
    document.getElementById('image_caption').innerHTML = '';
  } else {
    document.getElementById('image_caption').innerHTML =dataObject.caption.text;
  }
}

document.getElementById("navigation_right_arrow").addEventListener("click", function( event ) {
  navigateRight();
}, false);

document.getElementById("navigation_left_arrow").addEventListener("click", function( event ) {
  navigateLeft();
}, false);