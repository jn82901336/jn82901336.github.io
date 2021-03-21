/**
    * https://stackoverflow.com/a/39263992
    */
    function movingAvg(array, count, qualifier){
        var avg = function(array, qualifier){

            var sum = 0, count = 0, val;
            for (var i in array){
                val = array[i];
                if (!qualifier || qualifier(val)){
                    sum += val;
                    count++;
                }
            }

            return sum / count;
        };

        var result = [], val;

        for (var i=0; i < count-1; i++)
            result.push(null);

        for (var i=0, len=array.length - count; i <= len; i++){

            val = avg(array.slice(i, i + count), qualifier);
            if (isNaN(val))
                result.push(null);
            else
                result.push(Math.round(val));
        }

        return result;
    }

function graf(co){
 chart.data.datasets = [];
 chart.options.title.text=$('#'+co+' th').html();

 var color_index=0;
 $.each(vakciny, function (i,vakcina){
     var dv = (dataset_visibility[color_index]) ? false :  true;
     chart.data.datasets.push({hidden: dv, label: vakcina+' D', data: [], yAxisID: 'yP', fill: false, backgroundColor: default_colors[color_index], borderColor: default_colors[color_index]});
     lastP[vakcina]=0;
     color_index++;
 });

 $.each(vakciny, function (i,vakcina){
     var dv = (dataset_visibility[color_index]) ? false :  true;
     chart.data.datasets.push({hidden: dv, label: vakcina+' V', data: [], yAxisID: 'yP', fill: false, backgroundColor: default_colors[color_index], borderColor: default_colors[color_index]});
     lastO[vakcina]=0;
     color_index++;
 });

 var dv = (dataset_visibility[color_index]) ? false :  true;
 chart.data.datasets.push({hidden: dv, label: 'Nevyočkováno celkem', data: [], yAxisID: 'yP'});
 color_index++;

 var dv = (dataset_visibility[color_index]) ? false :  true;
 chart.data.datasets.push({hidden: dv, label: 'ø 7 dní', data: [], pointRadius:0 , fill: false, yAxisID: 'yP'});
 color_index++;
 
 if (co == 'CZ'){
  $.each(vakciny, function (i,vakcina){
     var dv = (dataset_visibility[color_index]) ? false :  true;
     chart.data.datasets.push({hidden: dv, label: vakcina+' CS', data: [], yAxisID: 'yP', fill: false, backgroundColor: default_colors[color_index], borderColor: default_colors[color_index]});
     lastE[vakcina]=0;
     color_index++;
  });
 }

 
  
 var TlastP=TlastO=TlastE=null;
 $.each(Object.keys(data), function (k,dt){
  $.each(vakciny, function (i,vakcina){
    cnt=(prijemT?.[dt]?.[co]?.[vakcina]) ? prijemT[dt][co][vakcina] : lastP[vakcina];
    if (vakcina=='Comirnaty') chart.data.datasets[0]['data'].push(cnt);
    if (vakcina=='Moderna') chart.data.datasets[1]['data'].push(cnt);
    if (vakcina=='AstraZeneca') chart.data.datasets[2]['data'].push(cnt);
    lastP[vakcina]=cnt;
    TlastP+=cnt;

    cnt=(ockovaniT?.[dt]?.[co]?.[vakcina]) ? ockovaniT[dt][co][vakcina] : lastO[vakcina];
    if (vakcina=='Comirnaty') chart.data.datasets[3]['data'].push(cnt);
    if (vakcina=='Moderna') chart.data.datasets[4]['data'].push(cnt);
    if (vakcina=='AstraZeneca') chart.data.datasets[5]['data'].push(cnt);
    lastO[vakcina]=cnt;
    TlastO+=cnt;
    
    if(co=='CZ'){
     cnt=(ecdcT?.[dt]?.[vakcina]) ? lastE[vakcina]+ecdcT[dt][vakcina] : lastE[vakcina];
     if (vakcina=='Comirnaty') chart.data.datasets[8]['data'].push(cnt);
     if (vakcina=='Moderna') chart.data.datasets[9]['data'].push(cnt);
     if (vakcina=='AstraZeneca') chart.data.datasets[10]['data'].push(cnt);
     lastE[vakcina]=cnt;
     TlastE+=cnt;
    }
  }); //each vakciny
  chart.data.datasets[6]['data'].push(TlastP-TlastO);
  TlastP=TlastO=TlastE=0;
 }); //each data
  
/* chart.scales['yO'].options.ticks.max=
 chart.scales['yP'].options.ticks.max=
 Object.values(lastP).reduce(function(a, b) {return a + b;});
*/
 chart.data.datasets[7]['data']= movingAvg(chart.data.datasets[6]['data'], 7);
 chart.update();
}

function addPrijem(d){
    prijemT=d;
    $.getJSON('data/ecdcT.min.json', addECDC);
}//addPrijem

function addECDC(d){
    ecdcT=d;
    $.getJSON('data/ockovaniT.min.json', addOckovani);
}//addPrijem



function addOckovani(d){
    ockovaniT=d;
    
    $.each(Object.keys(prijemT).concat(Object.keys(ockovaniT)).sort(), function(i, el) {
      data[el]=0;
      if (el==gend) return false;
    });

    vakciny=Object.keys(prijemT[ Object.keys(prijemT)[Object.keys(prijemT).length - 1]]['CZ']);
    vCnt=vakciny.length;

    var orig = Chart.defaults.global.legend.onClick;
    Chart.defaults.global.legend.onClick = function(e, legendItem) {
      dataset_visibility[legendItem.datasetIndex]=legendItem.hidden;
      orig.call(this, e, legendItem);
    };
 

    var ctx = document.getElementById('graf').getContext('2d');
    chart = new Chart(ctx, {
    title: 'Vakcinace',
    type: 'line',
    data: {
     labels: Object.keys(data),
    },
    options: {
        title: {
            display: true,
            text: 'Vakcinace'
        },
        scales: {
            yAxes: [
            /*{
                id: 'yO',
                stacked: false,
                ticks: {
                beginAtZero: true,
                min: 0,
                },
            },*/{
                id: 'yP',
                stacked: false,
                position: "right",
                ticks: {
                 beginAtZero: true,
                 min: 0,
                },

                
            }]
        },
        tooltips: {
//         mode: 'index',
         intersect: false,
         callbacks: {
         title: function(tooltipItem, data) {
                 d = new Date(data['labels'][tooltipItem[0]['index']]);
                 return tden[d.getDay()]+" "+data['labels'][tooltipItem[0]['index']];
                },
         label: function(tooltipItem, data) {
                if ( tooltipItem.datasetIndex < vCnt ){
                 var label = data.datasets[tooltipItem.datasetIndex].label || '';
                 var O = data.datasets[tooltipItem.datasetIndex+vCnt]['data'][tooltipItem.index];
                 label += ' '+tooltipItem.yLabel + '-' + O + '=' + (tooltipItem.yLabel-O);
                 label += ' (' + (100-Math.round((tooltipItem.yLabel-O)*100/tooltipItem.yLabel))+ '%)';
                }else if(tooltipItem.datasetIndex<2*vCnt){
                 var label = data.datasets[tooltipItem.datasetIndex].label || '';
                 var O = data.datasets[tooltipItem.datasetIndex-vCnt]['data'][tooltipItem.index];
                 label += ' '+tooltipItem.yLabel;
                 label += ' (' + (Math.round(tooltipItem.yLabel*100/O))+ '%)';
                }else{
                 var label = data.datasets[tooltipItem.datasetIndex].label || '';
                 label += ' ' + tooltipItem.yLabel;
                }
                return label;
                
                }, 
                
         },
        },
        hover: {
         mode: 'index',
         intersect: false
        },

    },//options 
        plugins: [{
         id: 'bgcolor',
         afterRender: (g) => {
          const c = g.canvas.getContext('2d');
          c.save();
          c.globalCompositeOperation = 'destination-over';
          c.fillStyle = 'white';
          c.fillRect(0, 0, g.canvas.width, g.canvas.height);
          c.restore();
         }
        }]// plugins 
    });
    graf('CZ');
}//addOckovani

var vCnt=0;
var lastP={};
var lastO={};
var lastE={};
var prijemT;
var ockovaniT;
var chart;
var data={};
var vakciny={};
var dataset_visibility=[0,0,0,0,0,0,1];
var tden=['Ne','Po','Út','St','Čt','Pá','So']
var gend='';
var default_colors = ['#3366CC','#994499','#109618','#0099C6','#DD4477','#22AA99','','','#6633CC','#E67300', '#66AA00',  '#FF9900', '#B82E2E','#316395','#DC3912','#AAAA11','#3B3EAC','#8B0707','#329262','#5574A6','#3B3EAC','#990099'] ;
$(function () {
 gend=new Date(new Date($('#dockovani').html())-3600).toISOString().split('T')[0];

 var table = $("#t").tablesorter({
  widgets: ["filter", "stickyHeaders","zebra","staticRow"],
   widgetOptions: {
     staticRow_class: "#CZ",
     filter_columnFilters: false,
    }
  
   });

 $.tablesorter.filter.bindSearch(table, $('.search') );   

 $.getJSON('data/prijemT.min.json', addPrijem);
 $('tr[id^=CZ]').click(function(i){graf($(this).attr('id'))});
 $('#save').click(function(){
      $('#save').attr('href',chart.toBase64Image());
 });

});