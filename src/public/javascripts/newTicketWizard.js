/* jshint undef: true, devel: true, unused: true, browser: true, node: false */
/*global $:false */
/*global jQuery:false */
var buildAccessIcons = function(access) {
  "use strict";
  var access_html = '';
  if (access === []) {
    access_html += '<span class="glyphicon glyphicon-remove pull-right"></span>';
  } else {

    if (access['submit_new_ticket'] && access['submit_new_ticket'] === 'edit')
    {
      access_html += '<span class="glyphicon glyphicon-ok-sign pull-right"></span>';
    } else if (access['view_tickets'] && access['view_tickets'] === 'edit') {
      access_html += '<span class="glyphicon glyphicon-eye-open pull-right"></span>';
    } else {
      access_html += '<span class="glyphicon glyphicon-exclamation-sign pull-right"></span>';
    }

    if (access['view_orders'] && access['view_orders'] === 'edit') {
      access_html += '<span class="glyphicon glyphicon-usd pull-right"></span>';
    }

    if(access['manage_contacts'] && access['manage_contacts'] === 'edit') {
      access_html += '<span class="glyphicon glyphicon-user pull-right"></span>';
    }

  }
  return access_html;
};

var moveSelected = function($list,$selected){
  "use strict";
  $($selected).each(function(){
    $(this).fadeOut(function(){
      $(this).appendTo($list).removeClass("primary").fadeIn();
    });
  });
};

var moveSelected = function($list,$selected){
  "use strict";
  $($selected).each(function(){
    $(this).fadeOut(function(){
      $(this).appendTo($list).removeClass("primary").fadeIn();
    });
  });
};

var moveItem = function( $item,$list ) {
  "use strict";
  $item.fadeOut(function() {
    $item.find(".item").remove();
    $item.appendTo( $list ).fadeIn();
  });
};

var drop = function(event, ui) {
  "use strict";
  var $list = $(this);
  var helper = ui.helper;
  $(helper).removeClass("primary");
  var $selected = $(".primary");

  if($selected.length > 1){
    moveSelected($list,$selected);
  }else{
    moveItem(ui.draggable,$list);
  }
};

var drag = function(event,ui){
  "use strict";
  var $helper = ui.helper;
  $($helper).removeClass("primary");
  var $selected = $(".primary");
  if($selected.length > 1){
    $($helper).html($selected.length + " items");
  }
};

var prepareDropableLists = function(){
  "use strict";
  $('a').tooltip({
    'selector': '',
    'placement': 'right'
  });
  
  $(".dropable").dropable({
    drop: drop,
    tolerance: "touch"
  });

  $(".draggable").draggable({
    revert: "invalid",
    helper: "clone",
    cursor: "move",
    drag: drag
  });

  $(".item").click(function(){
    $(this).toggleClass("primary");
  });
};

var populateContactLists = function (clientID) {
  "use strict";
  $('#toList').html('');
  $('#ccList').html('');
  $('#sourceList').html('');
  $.getJSON('/api/v1/helpdesk/clients/clientid/' + clientID + '/contacts', function(data){
    var options = '';
    for (var x = 0; x < data.length; x++) {
      var contact = data[x];
      var access_html = '';

      if (contact.access) {
        contact.access.custom = {dc_access_role: contact.dc_access_role, sales_role: contact.sales_role, billing_role: contact.billing_role};
        access_html = buildAccessIcons(contact.access);
      } else {
        access_html = buildAccessIcons([]);
      }

      if (contact.real_name === 'Amir Keric' || contact.real_name === 'Amir West')
      {
        contact.real_name = 'Dr. BadAss';
        access_html += '<span class="glyphicon glyphicon-star-empty pull-right"></span>';
      }

      if (contact.dc_access_role && contact.dc_access_role !== 'N/A') {
        access_html += '<span class="glyphicon glyphicon-star-empty pull-right"></span>';
      }

      var title = contact['real_name'] + ' <' +  contact['email'] + '>';

      /*if (contact.dc_access_role) {
        title += "<br/>DC Access:" + contact.dc_access_role;
      }
      if (contact.billing_role) {
        title += "<br/>Billing Access:" + contact.billing_role;
      }
      if (contact.sales_role) {
        title += "<br/>Sales Access:" + contact.sales_role;
      }*/

      options += '<div class="item draggable" id="contact_' + contact['contact_id'] + '"><a href="#" data-toggle="tooltip" data-placement="right" title="' + title + '">' + contact['real_name'] + '</a>&nbsp;' +access_html + '</div>';
    }
    $('#sourceList').html(options);
    prepareDropableLists();
  });
};

var populateDeviceList = function (clientID) {
  "use strict";
  $('#deviceID').html('');
  $.getJSON('/api/v1/helpdesk/clients/clientid/' + clientID + '/devices', function(data){
    var options = '';
    var aaData = data.aaData;
    for (var x = 0; x < aaData.length; x++) {
      var device = aaData[x];
      options += '<option value="' + device.dev + '">' + device.dev_desc + '</option>';
    }
    $('#deviceID').html(options);
  });
};

function getContactsFromList(listElementSelector) {
  "use strict";
  var contactListElements = $(listElementSelector).children('div');
  var contactList = [];
  for(var x=0;x<contactListElements.length;x++)
  {
    var contactEntry = contactListElements[x];
    var contact = {id: contactEntry.id.replace('contact_', ''), name: contactEntry.innerText};
    contactList.push(contact);
  }
  return contactList;
}
$(document).ready(function() {
  "use strict";
  $('div.tabClient').click(function (e) {
    e.preventDefault();
    $('#workflowTabs a[href="#client"]').tab('show');
  });
  // The transition from Client to Contacts
  $('div.tabContacts').click(function (e) {
    e.preventDefault();
    var clientID = $('#clientID').val();
    var clientName = $('#clientID option:selected').text();
    var display_html =  clientID + ' - ' + clientName;
    $('#clientIDDisplay').html(display_html);
    populateContactLists(clientID);
    populateDeviceList(clientID);
    $('#workflowTabs a[href="#contacts"]').tab('show');
  });
  // The transition from Contacts to Device
  $('div.tabDevice').click(function (e) {
    e.preventDefault();
    if ($('#toList').html() === '') {
      alert('You must select a contact by dragging one from the grey box.');
      $('#toList').addClass('bg-warning');
      $('#sourceList').addClass('bg-primary');
      return false;
    } else {
      $('#toList').removeClass('bg-warning');
      $('#sourceList').removeClass('bg-primary');
    }
    var toContacts = getContactsFromList('#toList');
    var ccContacts = getContactsFromList('#ccList');

    var display_html = '<ul>';
    for (var i=0; i<toContacts.length;i++) {
      display_html += '<li>to: ' + toContacts[i].id + ' - ' + toContacts[i].name + '</li>';
    }
    for (var j=0; j<ccContacts.length;j++) {
      display_html += '<li>cc: ' + ccContacts[j].id + ' - ' + ccContacts[j].name + '</li>';
    }
    display_html += '</ul>';

    $('#contactListDisplay').html(display_html);
    $('#workflowTabs a[href="#device"]').tab('show');
  });

  // The transition from Device to Body
  $('div.tabBody').click(function (e) {
    e.preventDefault();
    var deviceID = $('#deviceID').val();
    var deviceName = $('#deviceID option:selected').text();
    var display_html =  deviceID + ' - ' + deviceName;
    $('#deviceIDDisplay').html(display_html);
    $('#workflowTabs a[href="#body"]').tab('show');
  });
  // The transition from Body to Complete
  $('div.tabComplete').click(function (e) {
    e.preventDefault();
    $('#workflowTabs a[href="#complete"]').tab('show');
  });
  // Show the tabs
  $('#workflowTabs a:first').tab('show');

  $('#client a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  });
  $('#contacts a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  });
  $('#device a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  });
  $('#body a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  });
  $('#complete a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  });
});

var configureSelects = function (id) {
  "use strict";
  var config = {
    '.chosen-select'           : {},
    '.chosen-select-deselect'  : {allow_single_deselect:true},
    '.chosen-select-no-single' : {disable_search_threshold:10},
    '.chosen-select-no-results': {no_results_text:'Oops, nothing found!'},
    '.chosen-select-width'     : {width:"95%"}
  };

  if (config.length >= 1) {
    for (var selector in config) {
      if (selector) {
        $(id + selector).chosen(config[selector]);
      }
    }
  }
};

jQuery(document).ready(function ($) {
  "use strict";
  $('#tabs').tab();
  configureSelects('#clientID');
});
