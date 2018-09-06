jQuery(document).ready(function() {
  var mainContentText = jQuery('noscript').text();
  var mainContentHTML = jQuery.parseHTML(mainContentText);
  if (jQuery(mainContentHTML).find('table td a img').length === 0) {return;}
  var pager = jQuery(mainContentHTML).find('ul.pager').css('display', 'none');
  var tables = jQuery(mainContentHTML).find('table');
  var header = jQuery(mainContentHTML).find('h3').text();
  var asteriskSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38.7 36.6" class="single-colour icon-asterisk"><path d="M0 17.2l2.7-8.3c6.2 2.2 10.7 4.1 13.5 5.7C15.5 7.5 15.1 2.7 15.1 0h8.5c-0.1 3.9-0.6 8.7-1.3 14.5 4-2 8.6-3.9 13.8-5.6l2.7 8.3c-5 1.6-9.8 2.7-14.6 3.3 2.4 2.1 5.7 5.8 10.1 11.1l-7 5c-2.3-3.1-4.9-7.3-8-12.6 -2.9 5.5-5.4 9.7-7.6 12.6l-6.9-5c4.5-5.6 7.8-9.3 9.7-11.1C9.3 19.5 4.5 18.4 0 17.2z"/></svg>';
  var curvedArrowSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 35.3 31.4" class="single-colour curved-arrow-right"><path d="M35.3 22.8l-14.9-8.6v6.5H11c-3.9 0-7-3.1-7-7V0H0v13.7c0 6.1 4.9 11 11 11h9.5v6.7L35.3 22.8z"/></svg>';
  var crossSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34.3 34.3" class="single-colour cross"><path class="st0" d="M21.4 17.1l12-12c1.2-1.2 1.2-3.1 0-4.2 -1.2-1.2-3.1-1.2-4.2 0l-12 12 -12-12C4-0.3 2-0.3 0.9 0.9c-1.2 1.2-1.2 3.1 0 4.2l12 12 -12 12c-1.2 1.2-1.2 3.1 0 4.2C1.5 34 2.2 34.3 3 34.3s1.5-0.3 2.1-0.9l12-12 12 12c0.6 0.6 1.4 0.9 2.1 0.9s1.5-0.3 2.1-0.9c1.2-1.2 1.2-3.1 0-4.2L21.4 17.1z"/></svg>';

  jQuery('ul.pager').css('display', 'none');
  var currentlyLoadingImages = false;
  var batchSize = 20;
  var iteration = 1;
  var totalImagesLoaded = 0;
  var totalImagesInGallery;
  var galleryItems;
  // Add the gallery element to the page.
  var galleryElement = '<div class="image-gallery" data-thumbnail-dimensions="5:4"></div><div class="clr"></div><div class="load-more-images"><div class="spinner"></div></div>'
  jQuery('#main-content-strip .body-content').append(galleryElement);
  jQuery('#main-content-strip .body-content').append(pager);

  var galleryElements = [];
  jQuery.each(tables, function(index, table) {
    galleryElements.push({
      "type": "header",
      "value": jQuery(table).prev().text()
    });
    jQuery.each(jQuery(table).find('td'), function(index, row) {
      jQuery(row).remove('.element-invisible');
      var anchorElementsInCell = jQuery(row).find('a');
      var tagObjects = [];
      jQuery.each(anchorElementsInCell, function(index, anchor) {
        if (jQuery(anchor).find('img').length > 0 || jQuery(anchor).parent().hasClass('element-invisible') || jQuery(anchor).text().trim() === '') { return; }
        var tagObject = {
          'text': jQuery(anchor).text(),
          'href': jQuery(anchor).attr('href')
        }
        tagObjects.push(tagObject);
      });
      var tagElements = '';
      jQuery.each(tagObjects, function(index, tagObject) {
        var tagElement = "<li><a href=" + tagObject.href + ">" + tagObject.text + "</a></li>";
        tagElements += tagElement;
      });
      galleryElements.push({
        "type": "thumbnailUrl",
        "value": jQuery(row).find('img').attr('src'),
        "tags": tagElements || ''
      });

    });
  });
  generateInitialMarkup(galleryElements);

  function generateInitialMarkup(galleryElements) {
    var allImageElements = [];
    jQuery.each(galleryElements, function(index, galleryElement) {
      var element;
      var tagsHTML = galleryElement.tags !== '' ? "<ul>" + galleryElement.tags + "</ul>" : '';

      if (galleryElement.type === "header") {
        element = '<h3 style="display: none">' + galleryElement.value + '</h3>'
      } else if (galleryElement.type === "thumbnailUrl") {
        if (galleryElement.value) {
          var options = JSON.stringify({"caption" : "<ul><li>Tags: </li>" + galleryElement.tags + "</ul>"});
          var fullSizeImageUrl = galleryElement.value.replace('/sites/gallery.local/files/styles/node_gallery_thumbnail/public/node_gallery', '/sites/gallery.local/files/node_gallery');
            element = "<div class='gallery-thumbnail-container' style='display: none;'><a class='gallery-thumbnail' data-fancybox='gallery' data-options='" + options + "' href='" + fullSizeImageUrl + "' data-thumbmail-image='" + galleryElement.value + "'><div class='gallery-thumbnail-inner' style='background-image: none;'></div></a><div class='thumbnail-tags'>"  + tagsHTML + "</div></div>";
        }
      }
      jQuery('.image-gallery').append(element);
      jQuery('.image-gallery').find('h3:first').css('display', 'block');
    });
    loadImageBatch();
  }
  jQuery("[data-fancybox='gallery']").fancybox({
    idleTime: 9999999,
  });
  function loadImageBatch() {
    function thumbnailRequestComplete(fakeImage, thumbnailElement) {
      // Remove the fake image element from memory as soon as it has finished downloading, so as not to waste memory.
      jQuery(fakeImage).remove();
      imagesLoaded++;
      totalImagesLoaded ++;

      if (imagesLoaded === batchSize) {
        currentlyLoadingImages = false;
        iteration ++;
        checkLoad();
      }
      if (totalImagesLoaded === totalImagesInGallery) {
        jQuery(".load-more-images").css("display", "none");
        jQuery('#footer').css('display', 'block');
        jQuery('ul.pager').css('display', 'flex');
      }
    }
    jQuery('#footer').css('display', 'none');
    galleryItems = jQuery("a.gallery-thumbnail");
    totalImagesInGallery = galleryItems.length;
    currentlyLoadingImages = true;
    var lastIndex = batchSize*iteration;
    var firstIndex = batchSize*iteration-batchSize;
    var thisBatch = galleryItems.slice(firstIndex, lastIndex);

    var imagesLoaded = 0;
    jQuery.each(thisBatch, function(index, element) {
      var thumbnailElement = jQuery(this);


      var thumbnailPath = jQuery(this).attr("data-thumbmail-image");
      thumbnailElement.parent().css("display", "block");
      thumbnailElement.children('.gallery-thumbnail-inner').css("background-image", 'url(' + thumbnailPath + ')');
      // Create a fake image element in memory with src set to the thumbnail path, as this gives us a way to know when the image has finished loading.
      if (jQuery(thumbnailElement).parent().next('h3').length > 0) {
        jQuery(thumbnailElement).parent().next('h3').attr('style', 'display:block');
      }
      jQuery('<img src="'+ thumbnailPath +'">').on('load', function(responseTxt) {
        thumbnailRequestComplete(this, thumbnailElement);
      }).on('error', function(responseTxt) {
        thumbnailRequestComplete(this, thumbnailElement);
        jQuery(element).addClass('failed');
      });
      setGalleryImageHeight(thumbnailElement);


    });
  }



  function checkLoad() {
    var trigger = jQuery(".load-more-images");
    var trigger_position =  trigger.offset().top - jQuery(window).outerHeight();
    if (trigger_position > jQuery(window).scrollTop() || currentlyLoadingImages) {
      return;
    }
    loadImageBatch();
  };

  jQuery(window).scroll(function() {
    checkLoad();
  });

  function setGalleryImageHeight(thumbnailElement) {
    if (jQuery(thumbnailElement).children('.gallery-thumbnail-inner')) {
      var thumbnailHeightWidthRatio;
      if (jQuery('.image-gallery').attr('data-thumbnail-dimensions')) {
        var dimensions = jQuery('.image-gallery').attr('data-thumbnail-dimensions').split(":");
        thumbnailHeightWidthRatio = dimensions[1]/dimensions[0];
      } else {
        thumbnailHeightWidthRatio = 1;
      }
      var width = jQuery(thumbnailElement).children('.gallery-thumbnail-inner').css('width').replace('px', '');
      var height = width*thumbnailHeightWidthRatio;
      jQuery(thumbnailElement).children('.gallery-thumbnail-inner').css('height', height);
    }
  }
  jQuery(window).resize(function() {
    var thumbnailElements = jQuery("a.gallery-thumbnail");
    jQuery.each(thumbnailElements, function(index, item) {
      setGalleryImageHeight(item);
    })
  });


var categoryObjects = [];
  jQuery.each(jQuery('div.filters aside'), function(categoryIndex, filterBox) {
    var thisObject = {
      "values": [],
    }
    // TODO ideally, this should be looking for a class, not the header text. Note search does not have header text.
    var headerText = jQuery(this).find("h2").text().toLowerCase();
    if (!headerText) {
      thisObject.name = "search";
      if (thisObject.values.length > 0) {
        thisObject.preposition = "matching the term";
      }
    } else {
      if (headerText.indexOf("photographer") > -1) {
        thisObject.name = "photographer";
        thisObject.preposition = " by ";
        thisObject.showingAllText = " all photographers";
      } else if (headerText.indexOf("year") > -1) {
        thisObject.name = "year";
        thisObject.preposition = " in ";
        thisObject.showingAllText = " all years";
      } else if (headerText.indexOf("event") > -1) {
        thisObject.name = "event";
        thisObject.preposition = " at ";
        thisObject.showingAllText = " all Afrikaburn related events";
      }
    }
    var activeFilters = jQuery(filterBox).find('a.facetapi-active');
    var filterActive = activeFilters.length > 0;
    if (filterActive) {
      jQuery(filterBox).find('h2').after('<div class="filters-active-text">' + asteriskSVG + 'Filter active<div class="clr"></div></div>');
      jQuery.each(activeFilters, function(index, activeFilter) {
        jQuery(this).addClass('filter-active');
        var activeFilterText = jQuery(activeFilter).parent()
        .clone()    //clone the element
        .children() //select all the children
        .remove()   //remove all the children
        .end()  //again go back to selected element
        .text();
        thisObject.values.push('<span class="filter-name">' + activeFilterText + '</span>');
        jQuery(activeFilter).text("Clear this filter");
        jQuery(this).parent().append(activeFilter);
      });
    }
    categoryObjects.push(thisObject);
  });
  setFiltersOverview(categoryObjects);


  function setFiltersOverview(activeFiltersJSON) {
    sentenceCategoriesOrder = ["photographer", "year", "event", "search"];
    var sentenceSnippets = ["Showing images "];
    jQuery.each(sentenceCategoriesOrder, function(index, categoryName) {
      var thisFilterObject = activeFiltersJSON.find(function(item) {
        return item.name === categoryName;
      });
      if (!thisFilterObject) {return;}
      sentenceSnippets.push(thisFilterObject.preposition);
      var itemsList = thisFilterObject.values;

      if (itemsList.length > 0) {
        console.log(itemsList);
        if (itemsList.length === 1) {
          sentenceSnippets.push(' ' + itemsList[0]);
        } else if (itemsList.length > 1) {
          var lastItem = itemsList.slice(itemsList.length -1);
          var allButLastItems = itemsList.slice(0, itemsList.length -1);
          sentenceSnippets.push(allButLastItems.join(", "));
          sentenceSnippets.push(' and ' + lastItem[0]);
        }

      } else {
        if (thisFilterObject.name !== "search") {
          sentenceSnippets.push('<span class="filter-name">' + thisFilterObject.showingAllText + '</span>');
        }
      }
    });
    sentenceSnippets.push(".");
    var filtersHeader = '<div class="filters-header">' + sentenceSnippets.join("") + '</div>';
    jQuery("div.filters").before(filtersHeader);
  }

  var facetAPIElements = jQuery('.filters .block-facetapi').wrapAll("<div class='flex-box'></div>");

});