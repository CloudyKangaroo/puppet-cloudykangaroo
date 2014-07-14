/* The purpose of this helper is to render a graph from Graphite containing historical Sensu event data.
 * It's expected that this data is in the form of a StatsD counter.
 *
 * call graphButton() to render a button that will display a Graphite graph
 *
 * Client names are expected to be represented in the Graphite schema as their reversed domain components
 *   i.e., host1.example.com represented as com.example.host1
 *
 * graphConfig must provide the following properties:
 *   enabled -- Do nothing if this is not true
 *   urlPrefix -- example: "http://graphite.example.com/render/?"
 *   targetTemplate -- Example: "sensu.statsd_host.applications.counters.sensu.clientName.checkName"
 *     The client name and check name are substituted onto this string, and the severity is appended to the end
 *   height -- Height of graph to generate. Width is $('window').width() - 60
 *   timeRange -- Default from= time range for generating the initial graph
 */

var graphUrl = function(client, checkNameUnsub, graphConfig, from, until, width) {
  "use strict";
  var clientPath = client.split('.').reverse().join('.');
  var checkName = checkNameUnsub.replace(/\./g, '_');
  var baseTarget = graphConfig.targetTemplate.replace('clientName', clientPath).replace('checkName', checkName);

  var target = ('transformNull('+baseTarget+',0)');

  if (typeof(from) == 'undefined') {
    from = graphConfig.timeRange;
  }

  var additionalSettings = '&width='+width+'&height='+graphConfig.height+'&title='+client+' '+checkName+' event history&from='+from;

  if (typeof(until) != 'undefined') {
    additionalSettings += '&until='+until;
  }

  var url = graphConfig.urlPrefix+'target='+target+additionalSettings;
  return url;
};

var graphButton = function(client, checkName, graphConfig) {
  "use strict";
  if (graphConfig != {} && graphConfig.enabled) {
    return "<button onclick=\"displayGraph('"+client+"', '"+checkName+"', graphConfig);\" class=\"btn btn-default btn-xs btn-event\"><span class=\"glyphicon glyphicon-th span-event active\"></span></button> "
  } else {
    return ""
  }
};

var displayGraph = function(client, checkName, graphConfig, from, until) {
  "use strict";
  var width = $(window).width() - 60;
  var url = graphUrl(client, checkName, graphConfig, from, until, width);
  var box = bootbox.dialog({
    message: '<img align=middle src="'+url+'"><br><form name="timerange">From:<input id="image_from" type="text" name="from" value="'+(typeof(from) === 'undefined' ? '-8h' : from)+'">  Until:<input id="image_until" type="text" name="until" value="'+(typeof(until) === 'undefined' ? '' : until)+'">  <input type="submit" value="Redraw">',
    onEscape: function() {},
    animate: true
  });
  $("form").submit(function(event) {
    event.preventDefault();
    var from;
    var until;
    if ($("#image_from").val() != '') {
      from = $("#image_from").val();
    }
    if ($("#image_until").val() != '') {
      until = $("#image_until").val();
    }
    box.modal('hide');
    displayGraph(client, checkName, graphConfig, from, until);
  });
}
