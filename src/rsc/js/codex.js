var mastered = [0,0,0,0,0];
var totals = [0,0,0,0,0];
var categories = ["warframes", "archwings", "weapons", "archwingWeapons", "companions"];
var counters;
var fullData = {};
var masteryArr = [];

function loadCodex() {
  Mousetrap.bind('space', function(e) {
    toggleQuickModal();
  });
  Mousetrap.bind('enter', function(e) {
    if ($("#update-panel").hasClass('active')) {
      e.preventDefault();
      commitLibraryChanges();
    }
  });
  Mousetrap.bind('left', function(e) {
    if ($(".library-pane").hasClass('active')) {
      e.preventDefault();
      loadSearchPanel();
    }
  });
  Mousetrap.bind('right', function(e) {
    if ($(".search-pane").hasClass('active')) {
      e.preventDefault();
      loadLibraryPanel();
    }
  });
  Mousetrap.bind('?', function(e) {
    toggleHelpModal();
  });
  for (var i in categories) {
    var cat = categories[i];
    var rawData = $.ajax('data/' + cat + '.json', { async: false }).responseText;
    fullData[cat] = JSON.parse(rawData);
  }

  initTypeahead();
  var load = getURLParameter("load");
  if (load === "codex") {
    loadLibraryPanel();
  } else {
    loadSearchPanel();
  }

  updateData();
  preloadLibrary();
  masteryListener();

  $(document).on("scroll", onScroll);
  $(".btn-search-update").click(function( e ) {
    e.preventDefault();
    commitSearchChanges();
  });
  $(".btn-update").click(function( e ) {
    e.preventDefault();
    commitLibraryChanges();
  });
  $("#quick-add").click(function( e ) {
    e.preventDefault();
    toggleQuickModal();
  });
  $("#quickInput").keyup(function() {
    // Remove previous warnings.
    $("#quickInput").parent().removeClass('has-warning');
    $("#quickInputFeedback").html("");
  });
  $('#addModal').on('shown.bs.modal', function () {
    $('#quickInput').focus()
  })
  $(".search-feedback").click(function(event) {
    fadeHide($(".search-feedback"));
  });
  $(".panel-tabs").click(function(event) {
    if ($(this).attr("id") === "searchTab") {
      loadSearchPanel();
    } else if ($(this).attr("id") === "libraryTab") {
      loadLibraryPanel();
    }
  });
  $(".nav-icon").click(function(event) {
    var anchor = $(this).data("anchor");
    $('html, body').animate({
      scrollTop: $(".anchor#" + anchor).offset().top
    }, 500);
  });

  var timeoutId;
  $("#userInfoSlide").html("User ID: " + firebase.auth().currentUser.uid);
  $(".btn-logout").hover(function() {
    if (!timeoutId) {
      timeoutId = window.setTimeout(function() {
        timeoutId = null; // EDIT: added this line
        $("#userInfoSlide").addClass('active');
      }, 2000);
    }
  }, function () {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
  });
  $("#userInfoSlide").click(function(event) {

  });
}

function preloadLibrary() {
  for (var i in categories) {
    renderLibrary(categories[i]);
  }
  updateTotals();
}

function loadSearchPanel() {
  // Hide library pane.
  fadeHide($(".library-pane"));
  $("#total-counter").hide();
  $(".library-pane").removeClass("active");

  $(".panel-nav li.active").removeClass("active");
  $(".library-sidebar").removeClass("active");
  $("#searchTab").parent().addClass("active");

  fadeShow($(".search-pane"));
  $(".search-pane").addClass("active");
}

function loadLibraryPanel() {
  // Hide search pane.
  fadeHide($(".search-pane"));
  $(".search-pane").removeClass("active");

  $(".panel-nav li.active").removeClass("active");
  $(".library-sidebar").addClass("active");
  $("#libraryTab").parent().addClass("active");

  fadeShow($(".library-pane"));
  $("#total-counter").show();
  $(".library-pane").addClass("active");

  renderMastery();
}

function renderLibrary(cat) {
  var count = 0;
  var cat_id;
  switch (cat) {
    case 'warframes':
    cat_id = 1;
    break;
    case 'archwings':
    cat_id = 2;
    break;
    case 'weapons':
    cat_id = 3;
    break;
    case 'archwingWeapons':
    cat_id = 4;
    break;
    case 'companions':
    cat_id = 5;
    break;
    case 'sentinelWeapons':
    cat_id = 6;
    break;
  }

  // Sort alphanumerically.
  var sortArr = fullData[cat].sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });

  $.each( sortArr, function( i, obj ) {
    var id = obj.id;
    var entry = obj.name;
    var row = null;
    // Check if new row is needed.

    row = $("#" + cat + "Div .row:last-child");
    var entryDiv = $('<div>', {class: "col-md-2 mb-2 codex-entry", id: cat_id + id}).appendTo(row);

    var entryImg = null;
    var image_url = "rsc/img/" + cat + "/" + entry + ".png";
    $.get(image_url).done(function() {
      entryImg = $('<img>', {class: "codex-img", src: image_url}).appendTo(entryDiv);
      entryImg.click(function( e ) {
        var div = $(this).parent();
        dirtyEntry(div);
      });

      // Check for long text.
      var wordArr = entry.split(" ");
      wordArr = wordArr.sort(function(a,b) {
        return b.length - a.length;
      });
      var size = wordArr[0].length;
      if (size > 12) {
        $('<h5>', {class: "mt-2", text: entry, style: "font-size: xx-small"}).appendTo(entryDiv);
      } else {
        $('<h5>', {class: "mt-2", text: entry}).appendTo(entryDiv);
      }
      var gildedImg = $('<img>', {class: "gilded-img", src: "rsc/img/gold_logo.png"}).appendTo(entryDiv);
      gildedImg.click(function( e ) {
        dirtyEntry($(this).parent());
      });
    }).fail(function() {
      entryImg = $('<img>', {class: "codex-img", src: "rsc/img/silver_logo.png"}).appendTo(entryDiv);
      entryImg.click(function( e ) {
        var div = $(this).parent();
        dirtyEntry(div);
      });

      // Check for long text.
      var wordArr = entry.split(" ");
      wordArr = wordArr.sort(function(a,b) {
        return b.length - a.length;
      });
      var size = wordArr[0].length;
      if (size > 12) {
        $('<h5>', {class: "mt-2", text: entry, style: "font-size: x-small"}).appendTo(entryDiv);
      } else {
        $('<h5>', {class: "mt-2", text: entry}).appendTo(entryDiv);
      }
      var gildedImg = $('<img>', {class: "gilded-img", src: "rsc/img/gold_logo.png"}).appendTo(entryDiv);
      gildedImg.click(function( e ) {
        dirtyEntry($(this).parent());
      });
    })

    count++;
  });
  totals[cat_id - 1] = count;
  setTimeout(renderMastery(), 300);
}

// Apply gilded style and dirty bit to entryDiv
function dirtyEntry(div) {
  div.toggleClass("dirty");

  var count = $(".dirty").length;
  if (count > 0) {
    $("#update-text").html(count + " Pending Change(s)!");
    $("#update-panel").addClass("active");
  } else {
    $("#update-panel").removeClass("active");
    $("#update-text").html("");
  }
}

// Check if DB data is outdated.
function updateData() {
  var database = firebase.database();
  database.ref('/data/version').once('value').then(snapshot => {
    var dbVersion = snapshot.val();
    var localVersion = $.ajax('version', { async: false }).responseText.trim();
    if (dbVersion === localVersion) {
      console.log("DB up-to-date. No refresh needed.");
    } else {
      var updates = {};
      var dbData = {};
      for (var i in fullData) {
        var catData = fullData[i];
        for (var j in catData) {
          var innerData = {"id": catName(i) + catData[j].id};

          dbData[catData[j].name.toLowerCase()] = innerData;
        }
        // Push changes to DB.
      }
      updates['/data/index'] = dbData;
      updates['/data/version'] = localVersion;
      firebase.database().ref().update(updates);
    }
  });
}

// Listener for full library rendering
function masteryListener() {
  var userID = firebase.auth().currentUser.uid;
  var database = firebase.database();
  // Establish listener.
  var codexRef = database.ref('/users/' + userID + '/codex');
  codexRef.on('value', function(snapshot) {
    mastered = [0,0,0,0,0];
    masteryArr = [];

    // Cache new data.
    var freshData = snapshot.val();
    for (var entry in freshData) {
      mastered[entry.toString()[0] - 1]++;
      masteryArr.push(entry);
    }

    if ($(".library-pane").hasClass("active")) {
      renderMastery();
    }
  });
}
function renderMastery() {
  // Reset triggers.
  $(".mastered").removeClass('mastered');
  $(".dirty").removeClass('dirty');
  $("#update-panel").removeClass("active");
  $("#update-text").html("");

  // Apply triggers.
  for (var i in masteryArr) {
    var div = $("#" + masteryArr[i]);
    div.addClass("mastered");
  }
  updateTotals();
}
function updateTotals() {
  // Update counter text  $("#" + cat + "Counter").html("/" + count);
  $("#warframesCounter").html(mastered[0] + "/" + totals[0]);
  $("#archwingsCounter").html(mastered[1] + "/" + totals[1]);
  $("#weaponsCounter").html(mastered[2] + "/" + totals[2]);
  $("#archwingWeaponsCounter").html(mastered[3] + "/" + totals[3]);
  $("#companionsCounter").html(mastered[4] + "/" + totals[4]);

  function add(a, b) {
    return a + b;
  }
  var userSum = mastered.reduce(add, 0);
  var totalSum = totals.reduce(add, 0);
  $("#total-counter").html(userSum + "/" + totalSum + " Mastered");
}


function commitLibraryChanges() {
  // Compile changes from library.
  if ($(".dirty").length > 0) {
    var addArr = [];
    var delArr = [];
    $(".dirty").each(function(index, el) {
      if ($(this).hasClass("mastered")) {
        delArr.push($(this).attr("id"));
      } else {
        addArr.push($(this).attr("id"));
      }
    });
    pushToDB(addArr, delArr);
  }
}

function commitSearchChanges() {
  var feedback = $(".search-feedback");
  feedback.removeClass("table-success");
  feedback.removeClass("table-warning");

  // Compile changes from search.
  var val = $("#searchInput").val();
  retCode = -1;
  retVal = null;

  var entry = val.trim().toLowerCase();
  // Search for entry in data.
  for (key in fullData) {
    var code = catName(key);
    var subData = fullData[key];
    for (key2 in subData) {
      if (subData[key2].name.toLowerCase() === entry) {
        var id = code + subData[key2].id;
        if (masteryArr.indexOf(id) >= 0) {
          retCode = 1;
        } else {
          retCode = 0;
          retVal = id;
        }
        entry = subData[key2].name;
        break;
      }
    }
  }

  var feedbackStr = "";
  if (retCode === -1) {
    feedbackStr = "Please enter <i>something</i> of value, operator.";
  }
  else if (retCode === 0) {
    pushToDB([retVal], []);

    feedback.addClass("table-success");
    feedbackStr = "Success! " + entry + " added to codex, operator.";
  }
  if (retCode === 1) {
    feedback.addClass("table-warning");
    feedbackStr += "You've already mastered " + entry + ", operator.";
  }
  feedback.html(feedbackStr);

  var input = $("#searchInput");
  input.typeahead('close');
  input.typeahead('val', '');
  input.val("");
  input.blur();

  fastShow(feedback);
  setTimeout(function(){
    fadeHide(feedback);
  }, 7500);
}

function pushToDB(addArr, delArr) {
  // Grab user ID.
  var userID = firebase.auth().currentUser.uid;
  var database = firebase.database();
  // Push changes to DB.
  var updates = {};
  for (var i = 0; i < addArr.length; i++) {
    // Addition
    updates['/users/' + userID + '/codex/' + addArr[i]] = true;
  }
  for (var i = 0; i < delArr.length; i++) {
    // Deletion
    updates['/users/' + userID + '/codex/' + delArr[i]] = null;
  }
  return firebase.database().ref().update(updates);
}


function toggleHelpModal() {
  $("#helpModal").modal('toggle');
}

function toggleQuickModal() {
  if ($(".library-pane").hasClass("active")) {
    $("#addModal").modal('toggle');
  }
}
function submitQuickAdd() {
  var entry = $("#quickInput").val();
  var search = $("h5:contains('" + entry + "')").filter(function() {
    return $(this).text() === entry;
  });
  if (search.length > 0) {
    if (!search.parent().hasClass("mastered")) {
      $("#addModal").modal('hide');
      $("#quickInput").val("");
      dirtyEntry(search.parent());
      commitLibraryChanges();
    } else {
      // Already mastered!
      $("#quickInput").parent().addClass('has-warning');
      $("#quickInputFeedback").html("Already Mastered! Try again!");
    }
  } else {
    // No entry found!
    $("#quickInput").parent().addClass('has-warning');
    $("#quickInputFeedback").html("No entry found! Try again!");
  }
  return false;
}


// Utilities
function catID(id) {
  var code = (''+id)[0];
  switch (code) {
    case 1: return 'warframes';
    case 2: return 'archwings';
    case 3: return 'weapons';
    case 4: return 'archwingWeapons';
    case 5: return 'companions';
  }
}
function catName(name) {
  switch (name) {
    case 'warframes': return 1;
    case 'archwings': return 2;
    case 'weapons': return 3;
    case 'archwingWeapons': return 4;
    case 'companions': return 5;
  }
}

function searchByID(id) {
  for (var i in categories) {
    var cat = categories[i];
    console.log("Please implement me!");
  }
}
function searchByName(name) {
  for (var i in categories) {
    var cat = categories[i];
    console.log("Please implement me!");
  }
}

// Typeahead
function initTypeahead() {
  var warframesHound = new Bloodhound({
    datumTokenizer: function (d) { return Bloodhound.tokenizers.whitespace(d.name); },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: {
      cache: false,
      url: 'data/warframes.json',
      filter: function(list) {
        return $.map(list, function(item) {
          return {
            name: item.name
          };
        });
      }
    }
  });
  var archwingsHound = new Bloodhound({
    datumTokenizer: function (d) { return Bloodhound.tokenizers.whitespace(d.name); },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: {
      cache: false,
      url: 'data/archwings.json',
      filter: function(list) {
        return $.map(list, function(item) {
          return {
            name: item.name
          };
        });
      }
    }
  });
  var weaponsHound = new Bloodhound({
    datumTokenizer: function (d) { return Bloodhound.tokenizers.whitespace(d.name); },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: {
      cache: false,
      url: 'data/weapons.json',
      filter: function(list) {
        return $.map(list, function(item) {
          return {
            name: item.name
          };
        });
      }
    }
  });
  var archwingWeaponsHound = new Bloodhound({
    datumTokenizer: function (d) { return Bloodhound.tokenizers.whitespace(d.name); },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: {
      cache: false,
      url: 'data/archwingWeapons.json',
      filter: function(list) {
        return $.map(list, function(item) {
          return {
            name: item.name
          };
        });
      }
    }
  });
  var companionsHound = new Bloodhound({
    datumTokenizer: function (d) { return Bloodhound.tokenizers.whitespace(d.name); },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: {
      cache: false,
      url: 'data/companions.json',
      filter: function(list) {
        return $.map(list, function(item) {
          return {
            name: item.name
          };
        });
      }
    }
  });


  $('#searchInput').typeahead({
    name: 'searchAhead',
    hint: true,
    highlight: true,
    minLength: 1
  },{
    name: 'warframes',
    source: warframesHound,
    display: function (d) { return d.name; },
    templates: {
      header: '<h5 class="mt-2">Warframes</h5>'
    }
  },{
    name: 'archwings',
    source: archwingsHound,
    display: function (d) { return d.name; },
    templates: {
      header: '<h5 class="mt-2">Archwings</h5>'
    }
  },{
    name: 'weapons',
    source: weaponsHound,
    display: function (d) { return d.name; },
    templates: {
      header: '<h5 class="mt-2">Weapons</h5>'
    }
  },{
    name: 'archwingWeapons',
    source: archwingWeaponsHound,
    display: function (d) { return d.name; },
    templates: {
      header: '<h5 class="mt-2">Archwing Weapons</h5>'
    }
  },{
    name: 'companions',
    source: companionsHound,
    display: function (d) { return d.name; },
    templates: {
      header: '<h5 class="mt-2">Companions</h5>'
    }
  });
}
