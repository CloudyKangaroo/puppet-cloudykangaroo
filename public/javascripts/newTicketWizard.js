var buildAccessIcons = function(access) {
  var access_html = '';
  if (access == []) {
    access_html += '<span class="glyphicon glyphicon-remove pull-right"></span>';
  } else {

    if (access['submit_new_ticket'] && access['submit_new_ticket'] == 'edit')
    {
      access_html += '<span class="glyphicon glyphicon-ok-sign pull-right"></span>';
    } else if (access['view_tickets'] && access['view_tickets'] == 'edit') {
      access_html += '<span class="glyphicon glyphicon-eye-open pull-right"></span>';
    } else {
      access_html += '<span class="glyphicon glyphicon-exclamation-sign pull-right"></span>';
    }

    if (access['view_orders'] && access['view_orders'] == 'edit') {
      access_html += '<span class="glyphicon glyphicon-usd pull-right"></span>';
    }

    if(access['manage_contacts'] && access['manage_contacts'] == 'edit') {
      access_html += '<span class="glyphicon glyphicon-user pull-right"></span>';
    }

  }
  return access_html;
}
var populateContactLists = function (clientID) {
  /*

   submit_new_ticket: "edit"    inbox_plus
   view_tickets: "edit",  eye_open
   view_device: "view",
   view_orders: "edit" usd
   view_service: "edit",
   view_orders: "edit",
   view_quotes: "edit",
   */

  $('#toList').html('');
  $('#ccList').html('');
  $('#sourceList').html('');
  $.getJSON('/api/v1/ubersmith/clients/clientid/' + clientID + '/contacts', function(data){
    var options = '';
    for (var x = 0; x < data.length; x++) {
      var contact = data[x];
      var access_html = '';

      if (contact.access) {
        access_html = buildAccessIcons(contact.access);
      } else {
        access_html = buildAccessIcons([]);
      }

      if (contact.real_name == 'Amir Keric' || contact.real_name == 'Amir West')
      {
        contact.real_name = 'Dr. BadAss';
        access_html += '<span class="glyphicon glyphicon-star-empty pull-right"></span>';
      }

      if (contact.dc_access_role && contact.dc_access_role != 'N/A') {
        access_html += '<span class="glyphicon glyphicon-star-empty pull-right"></span>';
      }

      options += '<div class="item draggable" id="contact_' + contact['contact_id'] + '">' + contact['real_name'] + '&nbsp;' +access_html + '</span></div>';
    }
    $('#sourceList').html(options);
    prepareDroppableLists();
  });
}

var populateDeviceList = function (clientID) {
  $('#deviceID').html('');
  $.getJSON('/api/v1/ubersmith/clients/clientid/' + clientID + '/devices', function(data){
    var options = '';
    var aaData = data.aaData;
    for (var x = 0; x < aaData.length; x++) {
      var device = aaData[x];
      options += '<option value="' + device.dev + '">' + device.dev_desc + '</option>';
    }
    $('#deviceID').html(options);
  });
}

var prepareDroppableLists = function(){
  $(".droppable").droppable({
    drop: function(event, ui) {
      var $list = $(this);
      $helper = ui.helper;
      $($helper).removeClass("primary");
      var $selected = $(".primary");
      if($selected.length > 1){
        moveSelected($list,$selected);
      }else{
        moveItem(ui.draggable,$list);
      }
    }, tolerance: "touch"
  });

  $(".draggable").draggable({
    revert: "invalid",
    helper: "clone",
    cursor: "move",
    drag: function(event,ui){
      var $helper = ui.helper;
      $($helper).removeClass("primary");
      var $selected = $(".primary");
      if($selected.length > 1){
        $($helper).html($selected.length + " items");
      }
    }
  });

  function moveSelected($list,$selected){
    $($selected).each(function(){
      $(this).fadeOut(function(){
        $(this).appendTo($list).removeClass("primary").fadeIn();
      });
    });
  }

  function moveItem( $item,$list ) {
    $item.fadeOut(function() {
      $item.find(".item").remove();
      $item.appendTo( $list ).fadeIn();
    });
  }

  $(".item").click(function(){
    $(this).toggleClass("primary");
  });
};

function getContactsFromList(listElementSelector) {
  var contactListElements = $(listElementSelector).children('div');
  var contactList = [];
  for(x=0;x<contactListElements.length;x++)
  {
    var contactEntry = contactListElements[x];
    var contact = {id: contactEntry.id.replace('contact_', ''), name: contactEntry.innerText};
    contactList.push(contact);
  }
  return contactList;
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
    if ($('#toList').html() == '') {
      alert('You must select a contact by dragging one from the grey box.');
      $('#toList').addClass('bg-warning')
      $('#sourceList').addClass('bg-primary')
      return false;
    } else {
      $('#toList').removeClass('bg-warning');
      $('#sourceList').removeClass('bg-primary')
    }
    var toContacts = getContactsFromList('#toList');
    var ccContacts = getContactsFromList('#ccList');

    var display_html = '<ul>';
    for (i=0; i<toContacts.length;i++) {
      display_html += '<li>to: ' + toContacts[i].id + ' - ' + toContacts[i].name + '</li>';
    }
    for (i=0; i<ccContacts.length;i++) {
      display_html += '<li>cc: ' + ccContacts[i].id + ' - ' + ccContacts[i].name + '</li>';
    }
    display_html += '</ul>';
    $('#contactListDisplay').html(display_html);

    $('#workflowTabs a[href="#device"]').tab('show')
  });

  $('div.tabContacts').click(function (e) {
    e.preventDefault();
    var clientID = $('#clientID').val();
    var clientName = $('#clientID option:selected').text();
    var display_html =  clientID + ' - ' + clientName;
    $('#clientIDDisplay').html(display_html);
    populateContactLists(clientID);
    populateDeviceList(clientID);
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
