var populateContactLists = function () {

  var clientID = $('#clientID').val();

  $.getJSON('/api/v1/ubersmith/clients/clientid/' + clientID + '/contacts', function(data){
    var options = '';
    for (var x = 0; x < data.length; x++) {
      var contact = data[x];
      options += '<option value="' + contact['contact_id'] + '">' + contact['real_name'] + '</option>';
    }
    $('#contactIDTOList').html(options);
    $('#contactIDCCList').html(options);
    configureSelects('#contactIDTOList');
    configureSelects('#contactIDCCList')
  });
}

$(document).ready(function() {
  $('div.tabComplete').click(function (e) {
    e.preventDefault();
    $('#workflowTabs a[href="#complete"]').tab('show')
  });

  $('div.tabBody').click(function (e) {
    e.preventDefault();
    $('#workflowTabs a[href="#body"]').tab('show')
  });

  $('div.tabDevice').click(function (e) {
    e.preventDefault();
    $('#workflowTabs a[href="#device"]').tab('show')
  });

  $('div.tabContacts').click(function (e) {
    e.preventDefault();
    populateContactLists();
    $('#workflowTabs a[href="#contacts"]').tab('show')
  });

  $('div.tabClient').click(function (e) {
    e.preventDefault();
    $('#workflowTabs a[href="#client"]').tab('show')
  });

  $('#workflowTabs a:first').tab('show');
  $('#client a').click(function (e) {
    e.preventDefault()
    $(this).tab('show')
  });
  $('#contacts a').click(function (e) {
    e.preventDefault()
    $(this).tab('show')
  });
  $('#device a').click(function (e) {
    e.preventDefault()
    $(this).tab('show')
  });
  $('#body a').click(function (e) {
    e.preventDefault()
    $(this).tab('show')
  });
  $('#complete a').click(function (e) {
    e.preventDefault()
    $(this).tab('show')
  });
});

var configureSelects = function (id) {
  var config = {
    '.chosen-select'           : {},
    '.chosen-select-deselect'  : {allow_single_deselect:true},
    '.chosen-select-no-single' : {disable_search_threshold:10},
    '.chosen-select-no-results': {no_results_text:'Oops, nothing found!'},
    '.chosen-select-width'     : {width:"95%"}
  }
  for (var selector in config) {
    $(id + selector).chosen(config[selector]);
  }
}

jQuery(document).ready(function ($) {
  $('#tabs').tab();
  configureSelects('#clientID')
});
