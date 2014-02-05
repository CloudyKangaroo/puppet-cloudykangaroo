var successGauge, failuresGauge, noopsGauge, skipsGauge, totalGauge;
var numNodes, numResources, resourceDupes, resourcesPerNode;

window.onload = function(){
  numNodes = new JustGage({
    id: "numNodes",
    value: 0,
    min: 0,
    max: 1000,
    levelColors: ['#00FF00','#00FF00','#00FF00'],
    title: "Nodes",
    label: "#"
  });
  numResources = new JustGage({
    id: "numResources",
    value: 0,
    min: 0,
    max: 100,
    levelColors: ['#00FF00','#00FF00','#00FF00'],
    title: "Resources",
    label: "#/k"
  });
  resourceDupes = new JustGage({
    id: "resourceDupes",
    value: 0,
    min: 0,
    max: 100,
    levelColors: ['#FF0000','#FFFF00','#00FF00'],
    title: "Duplicate Resources",
    label: "%"
  });
  resourcesPerNode = new JustGage({
    id: "resourcesPerNode",
    value: 0,
    min: 0,
    max: 100,
    levelColors: ['#00FF00','#00FF00','#00FF00'],
    title: "Resources Per Node",
    label: "Avg"
  });
  successGauge = new JustGage({
    id: "successGauge",
    value: 0,
    min: 0,
    max: 100,
    levelColors: ['#FF0000','#FFFF00','#00FF00'],
    title: "Succeeded",
    label: "%"
  });
  failuresGauge = new JustGage({
    id: "failuresGauge",
    value: 0,
    min: 0,
    max: 100,
    title: "Failed",
    label: "%"
  });
  noopsGauge = new JustGage({
    id: "noopsGauge",
    value: 0,
    min: 0,
    max: 100,
    title: "NoOps",
    label: "%"
  });
  skipsGauge = new JustGage({
    id: "skipsGauge",
    value: 0,
    min: 0,
    max: 100,
    title: "Skipped",
    label: "%"
  });
/*  totalGauge = new JustGage({
    id: "totalGauge",
    value: 0,
    min: 0,
    max: 1000,
    title: "Total",
    label: "Hosts"
  });*/
  refreshGauges();
  setInterval(function() {
    refreshGauges();
  }, 60 * 2 * 1000);
};

var refreshGauges = function()
{
  $.getJSON('/api/v1/puppet/metrics/population', function (data) {
    console.log(data);
    $.each(data, function(key, val) {
      switch (key.toLowerCase()) {
        case 'numnodes':
          numNodes.refresh(Math.round(val));
          break;
        case 'numresources':
          numResources.refresh(Math.round(val/1000));
          break;
        case 'resourcedupes':
          resourceDupes.refresh(Math.round(val)*100);
          break;
        case 'resourcespernode':
          resourcesPerNode.refresh(Math.round(val));
          break;
      }
    });
  });
  $.getJSON('/api/v1/puppet/aggregate_event_counts/hours/24', function (data) {
    console.log(data);
    $.each(data, function(key, val) {
      switch (key.toLowerCase()) {
        case 'successes':
          successGauge.refresh(Math.round((val/data.total)*100));
          break;
        case 'failures':
          failuresGauge.refresh(Math.round((val/data.total)*100));
          break;
        case 'noops':
          noopsGauge.refresh(Math.round((val/data.total)*100));
          break;
        case 'skips':
          skipsGauge.refresh(Math.round((val/data.total)*100));
          break;
        case 'total':
          //totalGauge.refresh(Math.round(val));
          break;
      }
    });
  });
}