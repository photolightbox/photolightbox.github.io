// Initiate object to store access token
var config = {};

// Asks user for access_token
config.access_token = prompt("Please enter the access token to proceed");

// Initiate object to store current image id, json objects containing image information, image ids and image tags.
var browserState = {};

// Stores the id of the current image been displaysed (instagram image's id's are unique)
browserState.currentImageId;

// Array that stores the json object for each image
browserState.browserHistory = [];

// Array that stores individual img id, index number of image id corresponds to the location of the image's json object in browserState.browserHistory
browserState.browserHistoryImgId = [];

// Stores image tags, feeds into getImagesByTag function to display pictures.
browserState.imageTags = [];

// Adds event listeners for left and right arrow keys
window.addEventListener("keydown", function (event) {
  if (event.keyCode === 37) {
    event.preventDefault();
    navigateLeft();
  } else if (event.keyCode === 39) {
    event.preventDefault();
    navigateRight();
  }
}, true);

// Makes GET request to instagram API to grab popular images. Input parameter is a boolean value based on whether user pressed previous or next arrow.
var getImages = function(ifNext) {
  $.ajax({
    type: 'GET',
    dataType: 'jsonp',
    data: {},
    beforeSend: function() {
      document.getElementById('loading_symbol').innerHTML = '<img id="loading_image" src="assets/img/loading3.gif">';
    },
    complete: function() {
      var divParent = document.getElementById('loading_symbol');
      if(divParent.firstChild) {
        divParent.removeChild(divParent.firstChild);
      }
    },
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

// Invokes getImages upon browser load so user can see a picture
getImages('firstTime');

// Makes GET request to instagram API to grab images based on tag name. Input parameters the tag name (String), and whether should display next or previous image (Boolean value).
var getImagesByTag = function(tag, ifNext) {
  if(tag) {
    $.ajax({
      type: 'GET',
      dataType: 'jsonp',
      data: {},
      beforeSend: function() {
        document.getElementById('loading_symbol').innerHTML = '<img id="loading_image" src="assets/img/loading3.gif">';
      },
      complete: function() {
        var divParent = document.getElementById('loading_symbol');
        if(divParent.firstChild) {
          divParent.removeChild(divParent.firstChild);
        }
      },
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

// Processes the GET request response and calls the render function to display image
var processReqResponse = function(responseData, ifNext) {
  // Iterates through the responseData array
  for (var i = 0 ; i < responseData.length; i++) {
    // Saves all tags found in the responseData array to browserState.imagetags
    for(var j = 0 ; j < responseData[i].tags.length; j++) {
      if(browserState.imageTags.indexOf(responseData[i].tags[j]) < 0) {
        browserState.imageTags.push(responseData[i].tags[j]);
      }
    }

    // Checks all imageID's inside responseData and see if it has already been displayed. If not, it'll either be pushed or unshifted to browserState.browserHistory depending on whether next or previous key was pressed
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

  // Saves the current imageid to the first element returns from browserHistory if it has not been assigned a value yet
  browserState.currentImageId = browserState.currentImageId || browserState.browserHistoryImgId[0];

  // Checks whether any new images were added to browserHistoryImgId from the above for loop operation. If nothing was added, then call getImages or getImagesByTag to get new images
  if((browserState.browserHistoryImgId[browserState.browserHistoryImgId.length-1] === browserState.currentImageId && ifNext) || ((browserState.browserHistoryImgId[0] === browserState.currentImageId) && !ifNext)) {
    // If browserHistoryImgId has more than 50 tags, then start using tags inside browserImageTags to invoke the getImagesByTag function (which contains GET request to Instagram API) instead of invoking getImages (which contains GET request to get popular tags).
    if(browserState.browserHistoryImgId.length < 50) {
      console.log('about to getImages')
      getImages(ifNext);
      return;
    } else {
      var newTag = browserState.imageTags.shift();
      getImagesByTag(newTag, ifNext);      
      return;
    }
  } 

  // Determine the current index location inside the browserHistoryImgId array based on the currentImgId 
  var currentLocation = browserState.browserHistoryImgId.indexOf(browserState.currentImageId);

  // Checks if it is invoking the function for the first time (upon browser load or refresh) and render the image accordingly.
  if(ifNext === 'firstTime') {
    renderImages(browserState.browserHistory[currentLocation]);
    browserState.currentImageId = browserState.browserHistoryImgId[currentLocation];
    return;
  }

  // Checks if next or previous arrow was pressed, to change the currentLocation index
  if(ifNext) {
    currentLocation += 1;
  } else {
    currentLocation -= 1;
  }

  // Calls renderImages on the current index number inside browserHistory (json object containing image information)
  renderImages(browserState.browserHistory[currentLocation]);

  // Update the currentImageId
  browserState.currentImageId = browserState.browserHistoryImgId[currentLocation];
}

// Called when user press right arrow key or click right arrow. Checks where the user is inside browserHistoryImgId, if user is not at the end, call renderImages on the next image; if user is at the end of browserHistoryImgId array, call getImages to make more GET requests to the instagram api to get images.
var navigateRight = function() {
  if(browserState.browserHistoryImgId[browserState.browserHistory.length-1] === browserState.currentImageId) {
    getImages(true);
  } else {
    var index = browserState.browserHistoryImgId.indexOf(browserState.currentImageId);
    browserState.currentImageId = browserState.browserHistoryImgId[index+1];
    renderImages(browserState.browserHistory[index+1]);
  }
}

// Called when user press left arrow key or left right arrow. Checks where the user is inside browserHistoryImgId, if user is not at the beginning, call renderImages on the previous image; if user is at the beginning of browserHistoryImgId array, call getImages to make more GET requests to the instagram api to get images.
var navigateLeft = function() {
  if(browserState.browserHistoryImgId[0] === browserState.currentImageId) {
    getImages(false);
  } else {
    var index = browserState.browserHistoryImgId.indexOf(browserState.currentImageId);
    browserState.currentImageId = browserState.browserHistoryImgId[index-1];
    renderImages(browserState.browserHistory[index-1]);
  }
}

// Takes in a json object containing image information as the parameter and updates the dom
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

// Event listener for clicks on the right and left arrow, invokes navigateRight and navigateLeft function respectively.
document.getElementById("navigation_right_arrow").addEventListener("click", function( event ) {
  navigateRight();
}, false);
document.getElementById("navigation_left_arrow").addEventListener("click", function( event ) {
  navigateLeft();
}, false);
