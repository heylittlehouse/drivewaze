function initMap() {
  window.map = new google.maps.Map(document.getElementById('map'),
   {
    center: {lat: 40.7127, lng: -74.0059},
    scrollwheel: false,
    zoom: 14,
    mapTypeControl: false
    });

  var input = (document.getElementById('term'));

  new google.maps.places.Autocomplete(input);
  searchBox = new google.maps.places.SearchBox(input);
  // searchBox.addListener('places_changed', function(event) {



    google.maps.event.addDomListener(window, "resize", function() {
      var center = window.map.getCenter();
      google.maps.event.trigger(map, "resize");
      window.map.setCenter(center);
    });
  // })
}

//----------------
$(document).ready(function(){

  $("#newListingForm").on("submit",function(event){
    event.preventDefault();
    var listingAddress = $("#listingAddress").val();
    $("#listing_address").val(listingAddress);
    $("#listingPageAddress").hide();
    $("#listingPageInfo").removeClass('hide');
    $('#static-map').children()[0].src = "https://maps.googleapis.com/maps/api/staticmap?center=" + listingAddress + "&zoom=15&size=1000x1000&maptype=roadmap&markers=" + listingAddress + "&key=#{ENV['GMAP_STATIC_KEY']}"
  });


  if ($('#map').length) {

  initMap();
  (function(){

    $.ajax({
      method: 'get',
      url: '/listings'
      }).done(function(response) {
        for(var i = 0; i < response.length; i++) {
          var marker = new google.maps.Marker({
            map: window.map,
            position: {lat: response[i].latitude, lng: response[i].longitude},
            title: String(response[i].address),
            id: response[i].id
          });
          marker.addListener('click', function(event){
            $.ajax({
              method: 'get',
              url: '/listings/' + this.id
            }).done(function(response){
              // window.map.setCenter(marker.position);
              $(".single-listing").html(response);
             });
          });

        }
      }).fail(function(error){
      console.log(error);
      });
  })();

  $("#searchSubmitButton").on('click', function(event){
    event.preventDefault();
    var places = searchBox.getPlaces();
    var place = {term: places[0].formatted_address}
     $.ajax({
        method: 'post',
        url: '/search',
        data: $.param(place),
        dataType: 'json'
      }).done(function(response){
        var newLatLong = new google.maps.LatLng(response.results[0]["geometry"]["location"]["lat"], response.results[0]["geometry"]["location"]["lng"])
        window.map.setCenter(newLatLong)
        window.map.setZoom(14);
        toggleList();
      }).fail(function(error){
        console.log(error);
    });
  });

  window.map.addListener('bounds_changed', function(event){
    var latLong = window.map.getBounds()
    var ne = latLong.getNorthEast()
    var sw = latLong.getSouthWest()
    var westBound = sw.lng()
    var eastBound = ne.lng()
    var northBound = ne.lat()
    var southBound = sw.lat()
    var startTime = $('#searchArrivalDate').val() || "now"
    var endTime = $('#searchDepartureDate').val() || "now"
    $.ajax({
      method: 'get',
      url: '/search' +
           "?westBound=" + westBound +
           "&eastBound=" + eastBound +
           "&northBound=" + northBound +
           "&southBound=" + southBound +
           "&startTime=" + startTime +
           "&endTime=" + endTime
      }).done(function(response){
        var list = "";
        if (response.length == 0){
          list += "<div class='col-xs-12'><p>Sorry, it looks like there are no available places to park here at this time. Try checking other nearby cities or a different time period.</p></div>"
        }else{
          for(var i = 0; i < response.length; i++) {
            var marker = new google.maps.Marker({
              map: window.map,
              position: {lat: response[i].latitude, lng: response[i].longitude},
              title: String(response[i].address),
              id: response[i].id
            });
            marker.addListener('click', function(event){
              $.ajax({
                method: 'get',
                url: '/listings/' + this.id
              }).done(function(response){
                // window.map.setCenter(marker.position);
                $(".single-listing").html(response);
                var targetHeight = $("#listingPreviewInfo").height()+1;
                $("#listingPreviewImg").height(targetHeight);
               })
            });

             list += "<div class='col-xs-12'><p>"
             list += "<a href='/listings/"+response[i].id+"'>"
             list += response[i].address;
             list += "</a>"
             list += "</p></div>"
           } //end for loop
         }//end if-else

          $("#listView").html(list);

      }).fail(function(error){
        console.log(error);
      });
  }); //end bounds changed

  $('.single-listing').on('click', '.listing-info', function(event) {
    window.location.href = '/listings/' + this.id;
  });
  };

  $('#toggle-view-btn').on("click", function(event){
  })
});

function getCalendar(offset,type){
  if(type){
    $("#searchArrivalDate").attr("data-current",type);
    $("#searchArrivalDate").attr("data-offset",0);
  }
  $.ajax({
    method:"get",
    url:"listings/calendar?offset="+offset
  }).done(function(result){
    $("#filterCalendarView").html(result);
    $(".future").on("click",function(){
      var calendar = $("#searchArrivalDate").attr("data-current");
      if(calendar==="arrival"){
        $("#searchArrivalDate").val($(event.target).attr("data-day"));
        $("#filterCalendarView").html("");
      }else{
        $("#searchDepartureDate").val($(event.target).attr("data-day"));
        $("#filterCalendarView").html("");
      }
    })
  }).fail(function(error){
    console.log(error);
  });
}

function toggleMonth(direction){
  offset=parseInt($("#searchArrivalDate").attr("data-offset"));
  if(direction==="forward" && offset <2){
    console.log("forward");
    offset=offset+1;
    $("#searchArrivalDate").attr("data-offset",offset);
    getCalendar(offset);
  }else if(direction==="backward" && offset>=0){
    offset=offset-1;
    $("#searchArrivalDate").attr("data-offset",offset);
    getCalendar(offset);
  }
}

  function toggleList() {
    if ($('#listView').hasClass('hide')) {
      $('#listView').removeClass("hide")
    }
  }
