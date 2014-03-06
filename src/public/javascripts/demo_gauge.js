var gauge8, gauge7, gauge6, gauge5, gauge4;
var gauge3, gauge2, gauge1, gauge9;

window.onload = function(){
  gauge3 = new JustGage({
    id: "gauge3",
    value: 0,
    min: 0,
    max: 1000,
    levelColors: ['#00FF00','#00FF00','#00FF00'],
    title: "Nodes",
    label: "#"
  });
  gauge2 = new JustGage({
    id: "gauge2",
    value: 0,
    min: 0,
    max: 100,
    levelColors: ['#00FF00','#00FF00','#00FF00'],
    title: "Resources",
    label: "#k"
  });
  gauge1 = new JustGage({
    id: "gauge1",
    value: 0,
    min: 0,
    max: 100,
    levelColors: ['#FF0000','#FFFF00','#00FF00'],
    title: "Duplicate Resources",
    label: "%"
  });
  gauge9 = new JustGage({
    id: "gauge9",
    value: 0,
    min: 0,
    max: 100,
    levelColors: ['#00FF00','#00FF00','#00FF00'],
    title: "Resources Per Node",
    label: "Avg"
  });
  gauge8 = new JustGage({
    id: "gauge8",
    value: 0,
    min: 0,
    max: 100,
    levelColors: ['#FF0000','#FFFF00','#00FF00'],
    title: "Succeeded",
    label: "%"
  });
  gauge7 = new JustGage({
    id: "gauge7",
    value: 0,
    min: 0,
    max: 100,
    title: "Failed",
    label: "%"
  });
  gauge6 = new JustGage({
   id: "gauge6",
   value: 0,
   min: 0,
   max: 100,
   title: "NoOps",
   label: "%"
   });
  gauge5 = new JustGage({
    id: "gauge5",
    value: 0,
    min: 0,
    max: 100,
    title: "Skipped",
    label: "%"
  });
  gauge4 = new JustGage({
   id: "gauge4",
   value: 0,
   min: 0,
   max: 1000,
   title: "Total",
   label: "Reports"
   });
  refreshGauges();
  setInterval(function() {
    refreshGauges();
  }, 60 * 2 * 1000);
};

var refreshGauges = function()
{
  $.getJSON('/api/v1/puppet/metrics/population', function (data) {
    $.each(data, function(key, val) {
      switch (key.toLowerCase()) {
        case 'gauge3':
          gauge3.refresh(Math.round(val));
          break;
        case 'gauge2':
          gauge2.refresh(Math.round(val/1000));
          break;
        case 'gauge1':
          gauge1.refresh(Math.round(val*100));
          break;
        case 'gauge9':
          gauge9.refresh(Math.round(val));
          break;
      }
    });
  });

  $.getJSON('/api/v1/puppet/aggregate_event_counts/hours/4', function (data) {
    $.each(data, function(key, val) {
      switch (key.toLowerCase()) {
        case 'successes':
          gauge8.refresh(Math.round((val/data.total)*100));
          break;
        case 'failures':
          gauge7.refresh(Math.round((val/data.total)*100));
          break;
        case 'noops':
          gauge6.refresh(Math.round((val/data.total)*100));
          break;
        case 'skips':
          gauge5.refresh(Math.round((val/data.total)*100));
          break;
        case 'total':
          gauge4.refresh(Math.round(val));
          break;
      }
    });
  });
}