function graf(co){


 chart.data.datasets = [];

 chart.options.title.text=$('#'+co+' th').html();

 $.each(vakciny, function (i,vakcina){
     chart.data.datasets.push({hidden: true, label: vakcina+' D', data: [], yAxisID: 'yP', fill: false, borderColor: default_colors[i]});
     lastP[vakcina]=0;
 });

 $.each(vakciny, function (i,vakcina){
     chart.data.datasets.push({hidden: true, label: vakcina+' V', data: [], yAxisID: 'yP', fill: false, borderColor: default_colors[i+5]});
     lastO[vakcina]=0;
 });

 chart.data.datasets.push({label: 'Nevyočkováno celkem', data: [], yAxisID: 'yP'});
 
 var TlastP=TlastO=0;
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
  });
  chart.data.datasets[6]['data'].push(TlastP-TlastO);
  TlastP=TlastO=0;
 });
  
 
/* chart.scales['yO'].options.ticks.max=
 chart.scales['yP'].options.ticks.max=
 Object.values(lastP).reduce(function(a, b) {return a + b;});
*/
 chart.update();
}

function addPrijem(d){
    prijemT=d;
    $.getJSON('data/ockovaniT.min.json', addOckovani);
}//addPrijem



function addOckovani(d){
    ockovaniT=d;
    
    var last_dt;
    $.each(Object.keys(prijemT).concat(Object.keys(ockovaniT)).sort(), function(i, el) {
      data[el]=0;
      last_dt=el;
    });

    vakciny=Object.keys(ockovaniT[last_dt]['CZ']);
    vCnt=vakciny.length;

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
                 return data['labels'][tooltipItem[0]['index']];
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
    } 
    });
    

    graf('CZ');
}//addOckovani

var vCnt=0;
var lastP={};
var lastO={};
var prijemT;
var ockovaniT;
var chart;
var data={};
var vakciny={}
var default_colors = ['#3366CC','#DC3912','#FF9900','#109618','#990099','#3B3EAC','#0099C6','#DD4477','#66AA00','#B82E2E','#316395','#994499','#22AA99','#AAAA11','#6633CC','#E67300','#8B0707','#329262','#5574A6','#3B3EAC'] ;
$(function () {
 $.getJSON('data/prijemT.min.json', addPrijem);
 $('tr[id^=CZ]').click(function(i){graf($(this).attr('id'));});
 $('#save').click(function(){
      $('#save').attr('href',chart.toBase64Image());
 });
});