var viewer;

$(document).ready(function(){          
  start();
  $("#grafos").change(onSelectChange);            
  $("#txtSearch").autocomplete({                  
    source : function(request, response){
      data = search($("#txtSearch").val());
      response(data); 
    },
    minLength : 3,
    select : function(event, ui){
      highlight(ui.item.label);
    }
  }).keypress(function(e){
    var code = (e.keycode ? e.keycode : e.which);
    if (code == 13) {
      return false;
    }
  });                  
});
            
function onSelectChange(){
  $("#imgLoading").css({ display: "inline" });
  var selected = $("#grafos option:selected");
  var thereIsImage = false;
  var heigthImage = 0;
  var desLength = 0;
  var metricsLength = 0;
            
  $.getJSON('estadisticas.json',
  
  function(data){   
    $.each(data.graphs, function(i, item){    
        
      if(selected.val() == item.name){                  
        $("#txtSearch").val("");
        //sigma
        $('#sigma-example').empty();
        val = $('#theme').val();
        if (val == "paintViewer") {
          paintViewer(item.browsegraph)
        } else if(val == "hide"){
          hide(item.browsegraph);
        } else if(val == "fishEye"){
          fishEye(item.browsegraph);
        }
        
        $("#tituloGrafico").html(item.title);
        $("#tituloData").html(item.title);
        
        if(item.tip != ""){
          $("#hallazgos").html(item.tip);
        } else {
          $("#hallazgos").html("&nbsp;");
        }
                
        $("#nodesValue").html(item.nodes);
        $("#edgesValue").html(item.edges);
        $("#typeValue").html(item.type);

        $("#descriptionValue").html(item.description);
        desLength = item.description.length;          
        
        if(item.imgColorDescription != ""){                   
          $("#descriptionValue").append("<br/><img id='imgDescription' src='" + item.imgColorDescription + "' />");   
          thereIsImage = true;       

          $("#imgDescription").load(function(){
            heigthImage = $("#imgDescription").height();
            configGeneralInfo(desLength, thereIsImage, heigthImage, metricsLength);            
          });          
        }

        metricsLength = item.metrics.length;
        if(item.metrics.length > 0){
          $("#lblMetrics").css({ display: "inline" });
          var output = "<table class='table table-condensed'>";          
          for(i = 0; i < item.metrics.length; i ++){                      
            output += "<tr><td><span class='text-info' rel='popover' data-trigger='click' data-placement='bottom' data-html='true' data-original-title='Metric description' data-content='"   
               + item.metrics[i].description 
               + "'>" 
               + item.metrics[i].name 
               + "</span></td>" 
               + "<td style='text-align:right'>" + item.metrics[i].value + "</td>"
               +"</tr>";            
          }          
          output += "</table>"; 
          output += "<script type='text/javascript'> $('[rel=\"popover\"]').popover();</script>";         
          $("#metricsTable").html(output);          
        } else{
          $("#lblMetrics").css({ display: "none" });
          $("#metricsTable").html("");
        }       

        $("#descargar").attr("href", item.pdffile);
        $("#downloadCSV").attr("href", item.graphfile);   

        configGeneralInfo(desLength, thereIsImage, heigthImage, metricsLength);     
      }
      $("#imgLoading").css({ display: "none" });
    });
  });
}
function configGeneralInfo(dLength, existsImage, hImage, metricsSize){
  var totalSize = dLength + hImage + (metricsSize * 29);
  if(totalSize >= 1000){
    $("#generalInfo").height('600px');    
    $("#generalInfo").css('overflow', 'scroll');
  } else {
    $("#generalInfo").height('auto');
    $("#generalInfo").css('overflow', 'auto');
  }
  /*alert(dLength + " " + hImage + " " + existsImage);
  alert(totalSize + " " + existsImage);*/

}
function paintViewer(gexfPath){
  viewer = sigma.init(document.getElementById('sigma-example')).drawingProperties({
    defaultLabelColor: '#fff',
    defaultLabelSize: 14,
    defaultLabelBGColor: '#fff',
    defaultLabelHoverColor: '#000',
    labelThreshold: 1,
    defaultEdgeType: 'curve'
  }).graphProperties({
    minNodeSize: 0.5,
    maxNodeSize: 1.5,
    minEdgeSize: 1,
    maxEdgeSize: 1
  }).mouseProperties({
    maxRatio: 40
  });
  viewer.parseGexf(gexfPath);
  var greyColor = '#666';
  viewer.bind('overnodes',function(event){
    var nodes = event.content;
    var neighbors = {};
    viewer.iterEdges(function(e){
      if(nodes.indexOf(e.source)<0 && nodes.indexOf(e.target)<0){
        if(!e.attr['grey']){
          e.attr['true_color'] = e.color;
          e.color = greyColor;
          e.attr['grey'] = 1;
        }
      }else{
        e.color = e.attr['grey'] ? e.attr['true_color'] : e.color;
        e.attr['grey'] = 0;
 
        neighbors[e.source] = 1;
        neighbors[e.target] = 1;
      }
    }).iterNodes(function(n){
      if(!neighbors[n.id]){
        if(!n.attr['grey']){
          n.attr['true_color'] = n.color;
          n.color = greyColor;
          n.attr['grey'] = 1;
        }
      }else{
        n.color = n.attr['grey'] ? n.attr['true_color'] : n.color;
        n.attr['grey'] = 0;
      }
    }).draw(2,2,2);
  }).bind('outnodes',function(){
    viewer.iterEdges(function(e){
      e.color = e.attr['grey'] ? e.attr['true_color'] : e.color;
      e.attr['grey'] = 0;
    }).iterNodes(function(n){
      n.color = n.attr['grey'] ? n.attr['true_color'] : n.color;
      n.attr['grey'] = 0;
    }).draw(2,2,2);
  });
  
  viewer.draw();  
}

function hide(gexfPath) {
  // Instanciate sigma.js and customize rendering :
  var viewer = sigma.init(document.getElementById('sigma-example')).drawingProperties({
    defaultLabelColor: '#fff',
    defaultLabelSize: 14,
    defaultLabelBGColor: '#fff',
    defaultLabelHoverColor: '#000',
    labelThreshold: 6,
    defaultEdgeType: 'curve'
  }).graphProperties({
    minNodeSize: 0.5,
    maxNodeSize: 5,
    minEdgeSize: 1,
    maxEdgeSize: 1
  }).mouseProperties({
    maxRatio: 4
  });

  // Parse a GEXF encoded file to fill the graph
  // (requires "sigma.parseGexf.js" to be included)
  viewer.parseGexf(gexfPath);

  // Bind events :
  viewer.bind('overnodes',function(event){
    var nodes = event.content;
    var neighbors = {};
    viewer.iterEdges(function(e){
      if(nodes.indexOf(e.source)>=0 || nodes.indexOf(e.target)>=0){
        neighbors[e.source] = 1;
        neighbors[e.target] = 1;
      }
    }).iterNodes(function(n){
      if(!neighbors[n.id]){
        n.hidden = 1;
      }else{
        n.hidden = 0;
      }
    }).draw(2,2,2);
  }).bind('outnodes',function(){
    viewer.iterEdges(function(e){
      e.hidden = 0;
    }).iterNodes(function(n){
      n.hidden = 0;
    }).draw(2,2,2);
  });

  // Draw the graph :
  viewer.draw();
}

function fishEye(gexfPath) {
  /**
   * This is the code to write the FishEye plugin :
   */
  
  (function(){
 
    // First, let's write a FishEye class.
    // There is no need to make this class global, since it is made to be used through
    // the SigmaPublic object, that's why a local scope is used for the declaration.
    // The parameter 'sig' represents a Sigma instance.
    var FishEye = function(sig) { 
      sigma.classes.Cascade.call(this);      // The Cascade class manages the chainable property
                                             // edit/get function.
 
      var self = this;                       // Used to avoid any scope confusion.
      var isActivated = false;               // Describes is the FishEye is activated.
 
      this.p = {                             // The object containing the properties accessible with
        radius: 200,                         // the Cascade.config() method.
        power: 2
      };
 
      function applyFishEye(mouseX, mouseY) {   // This method will apply a formula relatively to
                                                // the mouse position.
        var newDist, newSize, xDist, yDist, dist,
            radius   = self.p.radius,
            power    = self.p.power,
            powerExp = Math.exp(power);
 
        sig.graph.nodes.forEach(function(node) {
          xDist = node.displayX - mouseX;
          yDist = node.displayY - mouseY;
          dist  = Math.sqrt(xDist*xDist + yDist*yDist);
 
          if(dist < radius){
            newDist = powerExp/(powerExp-1)*radius*(1-Math.exp(-dist/radius*power));
            newSize = powerExp/(powerExp-1)*radius*(1-Math.exp(-dist/radius*power));
 
            if(!node.isFixed){
              node.displayX = mouseX + xDist*(newDist/dist*3/4 + 1/4);
              node.displayY = mouseY + yDist*(newDist/dist*3/4 + 1/4);
            }
 
            node.displaySize = Math.min(node.displaySize*newSize/dist,10*node.displaySize);
          }
        });
      };
 
      // The method that will be triggered when Sigma's 'graphscaled' is dispatched.
      function handler() {
        applyFishEye(
          sig.mousecaptor.mouseX,
          sig.mousecaptor.mouseY
        );
      }
 
      this.handler = handler;
 
      // A public method to set/get the isActivated parameter.
      this.activated = function(v) {
        if(v==undefined){
          return isActivated;
        }else{
          isActivated = v;
          return this;
        }
      };
 
      // this.refresh() is just a helper to draw the graph.
      this.refresh = function(){
        sig.draw(2,2,2);
      };
    };
 
    // Then, let's add some public method to sigma.js instances :
    sigma.publicPrototype.activateFishEye = function() {
      if(!this.fisheye) {
        var sigmaInstance = this;
        var fe = new FishEye(sigmaInstance._core);
        sigmaInstance.fisheye = fe;
      }
 
      if(!this.fisheye.activated()){
        this.fisheye.activated(true);
        this._core.bind('graphscaled', this.fisheye.handler);
        document.getElementById(
          'sigma_mouse_'+this.getID()
        ).addEventListener('mousemove',this.fisheye.refresh,true);
      }
 
      return this;
    };
 
    sigma.publicPrototype.desactivateFishEye = function() {
      if(this.fisheye && this.fisheye.activated()){
        this.fisheye.activated(false);
        this._core.unbind('graphscaled', this.fisheye.handler);
        document.getElementById(
          'sigma_mouse_'+this.getID()
        ).removeEventListener('mousemove',this.fisheye.refresh,true);
      }
 
      return this;
    };
 
    sigma.publicPrototype.fishEyeProperties = function(a1, a2) {
      var res = this.fisheye.config(a1, a2);
      return res == s ? this.fisheye : res;
    };
  })();
 
  /**
   * Now, let's use our plugin :
   */
  var viewer = sigma.init(document.getElementById('sigma-example')).drawingProperties({
    defaultLabelColor: '#fff',
    defaultLabelSize: 14,
    defaultLabelBGColor: '#fff',
    defaultLabelHoverColor: '#000',
    labelThreshold: 6,
    defaultEdgeType: 'curve'
  }).graphProperties({
    minNodeSize: 0.5,
    maxNodeSize: 5,
    minEdgeSize: 1,
    maxEdgeSize: 1
  }).mouseProperties({
    maxRatio: 1,
    mouseEnabled: false
  });
 
  // (requires "sigma.parseGexf.js" to be executed)
  viewer.parseGexf(gexfPath);
 
  // Finally, let's activate the FishEye on our instance:
  viewer.activateFishEye().draw();
}
            
function start() {  
  onSelectChange();
}

function configView(valor){
  $('#grafos').val(valor).attr('selected', 'selected');
  onSelectChange();
}

//Based on http://gnutiez.de/wp/2012/12/19/animated-node-highlighting-with-sigma-js
function search(nodeName) {   
  var output =  new Array();
  //Loop all nodes
  viewer.iterNodes(function(n) {
    //if node label or index contains sarchterm
    if((n.label.toLowerCase().substring(0, nodeName.length) === nodeName.toLowerCase()) && nodeName != "") {           
      output.push(n.label);      
    }    
  }); 
  return output;
}

//Based on http://gnutiez.de/wp/2012/12/19/animated-node-highlighting-with-sigma-js
function highlight(nodeName) {
  var data =  new Array();
  if(nodeName != "") {  
    //Center Graph
    viewer.position(0,0,1).draw(2,2,2);
  }  
  //Loop all nodes
  viewer.iterNodes(function(n) {
    //creating new node attribute "big" to indicate if it is highlighted
    n.attr["big"] = 0;
    //if node label or index contains sarchterm
    if((n.label.toLowerCase() === nodeName.toLowerCase()) && nodeName != "") {             
      viewer.zoomTo(n['displayX'],n['displayY'],40);
    }
  }).draw(2, 2, 2)
}