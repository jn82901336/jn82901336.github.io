function pc_toggle(){
 
 pc=$('#pc').prop('checked')
 $('td[cnt]').each(function(){
  if (! pc){  
   $(this).html($(this).attr('cnt'));
  }
  else{
   var kraj=$(this).parent().attr('id');
   var cntpc=Math.round(($(this).attr('cnt')*100000)/kraje[kraj]['pop']);
   $(this).html(cntpc);
  }
 });
 $("#t").trigger("updateAll", [ true ]); 
 chart.destroy();

 if (pc) 
  pcgraf();
 else
  graf(last_graph);
 
}
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

function pcgraf(){

 var ctx = document.getElementById('graf').getContext('2d');
 chart=new Chart(ctx, 
  {
    plugins: [ChartDataLabels],
    type: 'bar',
    data: {
     labels: Object.values(kraje_nazev),
    },
    options: {
        plugins: {
            datalabels: {
             color: 'black',
             anchor: 'end',
             align: 'top',
            },
        },
         scales: {
         xAxes: [{ id: 'x', stacked: false }],
         yAxes: [{ id: 'y', stacked: false }]
        },
        title: {
            display: true,
            text: 'Vakcinace kraje (přepočet na 100tis obyvatel)'
        },
        tooltips: {
         mode: 'index',
         intersect: false,
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
    }
 );
 var vcount=vakciny.length;
 var color_index=0;
 $.each(vakciny, function (i,vakcina){
     var dv = (dataset_visibility[color_index]) ? false :  true;
     chart.data.datasets.push({hidden: dv, label: vakcina+' D', data: [], yAxisID: 'y', fill: false, backgroundColor: default_colors[color_index], borderColor: default_colors[color_index]});
     lastP[vakcina]=0;
     color_index++;
 });
 $.each(vakciny, function (i,vakcina){
     var dv = (dataset_visibility[color_index]) ? false :  true;
     chart.data.datasets.push({hidden: dv, label: vakcina+' V', data: [], yAxisID: 'y', fill: false, backgroundColor: default_colors[color_index], borderColor: default_colors[color_index]});
     lastO[vakcina]=0;
     color_index++;
 });

 var dv = (dataset_visibility[color_index]) ? false :  true;
 chart.data.datasets.push({hidden: dv, label: 'Celkem D', data: [], yAxisID: 'y', fill: false, backgroundColor: '#e5e5e5'});
 color_index++;
 var dv = (dataset_visibility[color_index]) ? false :  true;
 chart.data.datasets.push({hidden: dv, label: 'Celkem V', data: [], yAxisID: 'y', fill: false, backgroundColor: '#afafaf'});



 var dt=gend;
 $.each(Object.keys(kraje), function (k,co){
  var pc_koef = ( pc ) ? kraje[co]['pop']/100000 : 1;
  kraje[co]['totP']=0;
  kraje[co]['totO']=0;

  $.each(vakciny, function (i,vakcina){

    cnt=(prijemT?.[dt]?.[co]?.[vakcina]) ? Math.round(prijemT[dt][co][vakcina]/pc_koef) : lastP[vakcina];
    var index=vakciny.indexOf(vakcina);
    chart.data.datasets[index]['data'].push(cnt)
    lastP[vakcina]=cnt;
    kraje[co]['totP']+=prijemT[dt][co][vakcina];

    cnt=(ockovaniT?.[dt]?.[co]?.[vakcina]) ? Math.round(ockovaniT[dt][co][vakcina]/pc_koef) : lastO[vakcina];
    chart.data.datasets[index+vcount]['data'].push(cnt);
    lastO[vakcina]=cnt;
    kraje[co]['totO']+=ockovaniT[dt][co][vakcina];
    
  }); //each vakciny
   
   chart.data.datasets[2*vcount]['data'].push(Math.round(kraje[co]['totP']/pc_koef));
   chart.data.datasets[2*vcount+1]['data'].push(Math.round(kraje[co]['totO']/pc_koef));

 }); //each kraje

 chart.update();

}

function graf(co){
 last_graph=co;
 var ctx = document.getElementById('graf').getContext('2d');
 chart=new Chart(ctx, {
    title: 'Vakcinace',
    type: 'line',
    data: {
     labels: Object.keys(data),
    },
    options: {
        plugins: {
            datalabels: {
             display: false,
            },
        },    
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
 chart.data.labels=Object.keys(data);
 chart.options.title.text=$('#'+co+' th').html();

 var pc_koef = ( pc ) ? kraje[co]['pop']/100000 : 1;
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
 
 if (co == 'CZ0'){
  $.each(vakciny, function (i,vakcina){
     var dv = (dataset_visibility[color_index]) ? false :  true;
     chart.data.datasets.push({hidden: dv, label: vakcina+' CS', data: [], yAxisID: 'yP', fill: false, backgroundColor: default_colors[color_index], borderColor: default_colors[color_index]});
     lastE[vakcina]=0;
     color_index++;
  });
 }

  
 var TlastP=TlastO=TlastE=null;
 var vcount=vakciny.length;
 $.each(Object.keys(data), function (k,dt){
  $.each(vakciny, function (i,vakcina){
    cnt=(prijemT?.[dt]?.[co]?.[vakcina]) ? Math.round(prijemT[dt][co][vakcina]/pc_koef) : lastP[vakcina];
    var index=vakciny.indexOf(vakcina);
    chart.data.datasets[index]['data'].push(cnt)
    lastP[vakcina]=cnt;
    TlastP+=cnt;
    
    cnt=(ockovaniT?.[dt]?.[co]?.[vakcina]) ? Math.round(ockovaniT[dt][co][vakcina]/pc_koef) : lastO[vakcina];
    chart.data.datasets[index+vcount]['data'].push(cnt);
    lastO[vakcina]=cnt;
    TlastO+=cnt;
    
    if(co=='CZ0'){
     cnt=(ecdcT?.[dt]?.[vakcina]) ? Math.round(lastE[vakcina]+ecdcT[dt][vakcina]/pc_koef) : lastE[vakcina];
     chart.data.datasets[index+vcount+vcount+2]['data'].push(cnt);
     lastE[vakcina]=cnt;
     TlastE+=cnt;
    }
  }); //each vakciny
  chart.data.datasets[2*vcount]['data'].push(TlastP-TlastO);
  TlastP=TlastO=TlastE=0;
 }); //each data
  
/* chart.scales['yO'].options.ticks.max=
 chart.scales['yP'].options.ticks.max=
 Object.values(lastP).reduce(function(a, b) {return a + b;});
*/
 chart.data.datasets[2*vcount+1]['data']= movingAvg(chart.data.datasets[2*vcount]['data'], 7);
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

    vakciny=Object.keys(prijemT[ Object.keys(prijemT)[Object.keys(prijemT).length - 1]]['CZ0']);
    vCnt=vakciny.length;

    var orig = Chart.defaults.global.legend.onClick;
    Chart.defaults.global.legend.onClick = function(e, legendItem) {
      dataset_visibility[legendItem.datasetIndex]=legendItem.hidden;
      orig.call(this, e, legendItem);
    };
 

    graf('CZ0');
}//addOckovani

var vCnt=0;
var lastP={};
var lastO={};
var lastE={};
var prijemT;
var ockovaniT;
var chart;
var chartconfig;
var data={};
var vakciny={};
var dataset_visibility=[0,0,0,0,0,0,0,0,0,1];
var tden=['Ne','Po','Út','St','Čt','Pá','So']
var gend='';
var pc=false;
var last_graph;
var kraje={};
var kraje_nazev={};
var default_colors = ['#3366CC','#994499','#109618','#0099C6','#DD4477','#22AA99','','','#6633CC','#E67300', '#66AA00',  '#FF9900', '#B82E2E','#316395','#DC3912','#AAAA11','#3B3EAC','#8B0707','#329262','#5574A6','#3B3EAC','#990099'] ;
$(function () {
 gend=new Date(new Date($('#dockovani').html())-3600).toISOString().split('T')[0];

 var table = $("#t").tablesorter({
  widgets: ["filter", "stickyHeaders","zebra","staticRow"],
   widgetOptions: {
     staticRow_class: "#CZ0",
     filter_columnFilters: false,
    }
  
   });

 $.tablesorter.filter.bindSearch(table, $('.search') );   

 $.getJSON('data/prijemT.min.json', addPrijem);
 $('tr[id^=CZ]').click(function(i){
  chart.destroy();
  graf($(this).attr('id'))
  });
 $('#save').click(function(){
      $('#save').attr('href',chart.toBase64Image());
 });
 
 $.getJSON('data/kraj.json', function(d){
  kraje=d;
  $.each(kraje, function (kraj,obj){
   kraje[kraj]['totP']=0;
   kraje[kraj]['totO']=0;
   kraje_nazev[kraj]=kraje[kraj]['name'];
  });
  $('#pc').click(function (){pc_toggle();});
  $('td[cnt]').each(function(){
   $(this).attr('cnt',$(this).html());
  })
 });

 
});