jQuery(document).ready(function() {
  jQuery('ul.pager').css('display', 'none');

  var currentlyLoadingImages = false;
  var batchSize = 20;
  var iteration = 1;
  var totalImagesLoaded = 0;
  var totalImagesInGallery;
  var galleryItems;


  var mainContentText = jQuery('noscript').text();
  var mainContentHTML = jQuery.parseHTML(mainContentText);
  var pager = jQuery(mainContentHTML).find('ul.pager');
  var tables = jQuery(mainContentHTML).find('table');
  var header = jQuery(mainContentHTML).find('h3').text();


  // Add the gallery element to the page.
  var galleryElement =
  `
  <div class="image-gallery" data-thumbnail-dimensions="5:4"></div>
  <div class="clr"></div>
  <div class="load-more-images"><div class="loader"></div></div>`
  jQuery('#main-content-strip .body-content').append(galleryElement);
  jQuery('#main-content-strip .body-content').append(pager);

  var galleryElements = [];

  jQuery.each(tables, function(index, table) {
    galleryElements.push({
      "type": "header",
      "value": jQuery(table).prev().text()
    });
    jQuery.each(jQuery(table).find('td'), function(index, row) {
      galleryElements.push({
        "type": "thumbnailUrl",
        "value": jQuery(row).find('img').attr('src')
      });
    });
  });

  console.log(galleryElements);
  generateInitialMarkup(galleryElements);


  function generateInitialMarkup(galleryElements) {
    var allImageElements = [];
    jQuery.each(galleryElements, function(index, galleryElement) {
      var element;
      if (galleryElement.type === "header") {
        element = `<h3 style='display: none'>${galleryElement.value}</h3>`
      } else if (galleryElement.type === "thumbnailUrl") {
        if (galleryElement.value) {
          var fullSizeImageUrl = galleryElement.value.replace('/sites/gallery.local/files/styles/node_gallery_thumbnail/public/node_gallery', '/sites/gallery.local/files/node_gallery');
            element = `<a class='gallery-thumbnail' data-fancybox='gallery' href='${fullSizeImageUrl}' data-thumbmail-image='${galleryElement.value}'>
          <div class='gallery-thumbnail-inner' style='background-image: none; display: none;'></div>
          </a>`;

        }
      }
      jQuery('.image-gallery').append(element);
      jQuery('.image-gallery').find('h3:first').css('display', 'block');
    });
    loadImageBatch('from generateInitialMarkup');
  }

  function loadImageBatch(test) {
    jQuery('#footer').css('display', 'none');
    galleryItems = jQuery("a.gallery-thumbnail");
    totalImagesInGallery = galleryItems.length;
    currentlyLoadingImages = true;
    var lastIndex = batchSize*iteration;
    var firstIndex = batchSize*iteration-batchSize;
    var thisBatch = galleryItems.slice(firstIndex, lastIndex);
    var imagesLoaded = 0;
    console.log(thisBatch);
    jQuery.each(thisBatch, function(index, element) {
      var thumbnailElement = jQuery(this);
      var thumbnailPath = jQuery(this).attr("data-thumbmail-image");
      thumbnailElement.children('.gallery-thumbnail-inner').css("background-image", `url(${thumbnailPath})`).css("display", "block");
      setGalleryImageHeight(thumbnailElement);
      if (jQuery(this).next('h3').length > 0) {
        var bottomMargin = jQuery(this).next('h3').css('marginBottom');
        jQuery(this).next('h3').attr('style', `display:block; margin-top: ${bottomMargin}; float: left; width: 100%`);
      }
      // Create a fake image element in memory with src set to the thumbnail path, as this gives us a way to know when the image has finished loading.
      jQuery('<img/>').attr('src', thumbnailPath).on('load', function() {
        // Remove the fake image element from memory as soon as it has finished downloading, so as not to waste memory.
        jQuery(this).remove();
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
        }
      });
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
});