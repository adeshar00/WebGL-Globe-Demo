/* Sphere display

*/

var winwidth = 500;
var winheight = 500;


// Global vars
var c;
var gl;
var vertexPosBuffer;
var vertices;
var program;
var vs = new String("");
var fs = new String("");

//var td_theta = -Math.PI/4;
var td_theta = 0;//Math.PI/2;
var td_phi = -Math.PI*5/16;

var time = 0;
var projmatrix;

var globe;
var fr;
var arc;

var text1;
var image1;


$(document).ready(function()
{
	init();
});


function init()
{
	$("#gldisplay").append("<canvas id=\"td_canvas\" width=\""+winwidth+"\" height=\""+winheight+"\"></canvas>");
	$("#gldisplay").append("<br>Click to rotate ");
	$("#gldisplay").append("<button id=\"td_turnl\">&lt;-</button>");
	$("#gldisplay").append("<div style=\"display:inline-block\"><div><button id=\"td_turnu\">^</button></div><div><button id=\"td_turnd\">v</button></div></div>");
	$("#gldisplay").append("<button id=\"td_turnr\">-&gt;</button>");

	$("#td_turnl").click(function(){td_theta+=Math.PI/16;render()});
	$("#td_turnr").click(function(){td_theta-=Math.PI/16;render()});
	//$("#td_turnu").click(function(){td_phi+=Math.PI/16;if(td_phi>Math.PI/2)td_phi=Math.PI/2;render()});
	//$("#td_turnd").click(function(){td_phi-=Math.PI/16;if(td_phi<-Math.PI/2)td_phi=-Math.PI/2;render()});
	$("#td_turnu").click(function(){td_phi+=Math.PI/16;render()});
	$("#td_turnd").click(function(){td_phi-=Math.PI/16;render()});
	c = document.getElementById('td_canvas');
	//c = $("#td_canvas");
	var cj = $("#td_canvas");
	cj.css("border","1px solid #000000");



	gl = c.getContext('experimental-webgl');
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	vs = ""+
	"attribute vec3 pos;"+
	"attribute vec2 tex;"+
	"varying float z;"+
	"varying highp vec2 texture;"+
	"varying vec3 posf;"+
	"uniform mat4 test;"+
	"void main()"+
	"{"+
	"	posf = pos;"+
	"	gl_Position = test*vec4(pos, 1);"+
	"	z = gl_Position[2]/gl_Position[3];"+
	"	texture = tex;"+
	"}";

	fs = ""+
	"precision mediump float;"+
	"varying vec3 posf;"+
	"vec3 posv;"+
	"uniform vec3 col;"+
	"uniform float time;"+
	"varying float z;"+
	"vec4 color;"+
	"varying highp vec2 texture;"+ // highp necessary? FLAG
	"uniform sampler2D uSampler;"+
	""+
	"void mix(vec3 ncolor, float weight)"+
	//"void mix(inout vec4 mod)"+
	"{"+
	//"	color = weight*ncolor+(1.0-weight)*color;"+
	//"	mod[0] = 1.0;"+//weight*ncolor[0]+(1.0-weight)*color[0];"+
//	"	mod[1] = 0.0;"+//weight*ncolor[0]+(1.0-weight)*color[0];"+
	//"	mod[2] = 1.0;"+//weight*ncolor[0]+(1.0-weight)*color[0];"+
	"	color[0] = weight*ncolor[0]+(1.0-weight)*color[0];"+
	"	color[1] = weight*ncolor[1]+(1.0-weight)*color[1];"+
	"	color[2] = weight*ncolor[2]+(1.0-weight)*color[2];"+
	"}"+
	""+
	/*"void main()"+
	"{"+
	"	color = vec4(0.9,0.9,0.9,1.0);"+
	"	float p0 = 5.0*posf[0];"+
	"	p0-= floor(p0);"+
	"	float p1 = 5.0*posf[1];"+
	"	p1-= floor(p1);"+
	"	float p2 = 5.0*posf[2];"+
	"	p2-= floor(p2);"+
	"	if(p0<0.1 || p1<0.1 || p2<0.1)"+// FLAG use approximations instead of these expensive trig calls!!!!
	"	{"+
	"		color = vec4(0.0,0.0,0.0,1.0);"+
	"	}"+
	"	color*= (1.0-z)*0.5;"+
	"	gl_FragColor = color;"+
	"}";//*/
	"void main()"+
	"{"+
	"	color = texture2D(uSampler, texture);"+
	//"	color = vec4(1.0,1.0,1.0,1.0);"+
	"	float temp;"+
	"	float radius = 0.35;"+
	"	float imag = inversesqrt(posf[0]*posf[0]+posf[1]*posf[1]+posf[2]*posf[2]);"+
	"	posv[0] = posf[0]*imag;"+
	"	posv[1] = posf[1]*imag;"+
	"	posv[2] = posf[2]*imag;"+
	"	float dist = acos((-0.577350269*posv[0]-0.577350269*posv[1]+0.577350269*posv[2]));"+
	"	if(dist<radius)"+// FLAG use approximations instead of these expensive trig calls!!!!
	"	{"+
	"		temp = 1.0-dist/radius;"+
	//"		temp*= temp;"+
	//"		temp+= 1.0;"+
	"		dist = temp*0.5*(1.0+sin(dist*120.0-time*0.4));"+
	"		mix( vec3(1.0, 1.0, 0.0), dist);"+
	"	}"+
	"	color*= (1.0-z)*0.5;"+
	//"	color[3]= 0.5;"+
	"	gl_FragColor = color;"+
	"}";

	triaprogram = createProgram(vs,fs);
//*
	vs = ""+
	"attribute vec3 pos;"+
	"varying float z;"+
	"uniform mat4 test;"+
	"void main()"+
	"{"+
	"	gl_Position = test*vec4(pos, 1);"+
	"	z = gl_Position[2]/gl_Position[3];"+
	"}";

	fs = ""+
	"precision mediump float;"+
	"uniform vec3 col;"+
	"varying float z;"+
	"void main()"+
	"{"+
	"	gl_FragColor = vec4( col[0]*(1.0-z)*0.5, col[1]*(1.0-z)*0.5, col[2]*(1.0-z)*0.5, 1.0);"+
	"}";

	edgeprogram = createProgram(vs,fs);
//*/

	text1 = gl.createTexture();
	image1 = new Image();
	image1.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, text1);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image1);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
	image1.src = "map.jpg";
	//image1.src = "ff2map.png";
	

	globe = makesphere(0.9, 31, 64,  0, 0, 0);
	fr = makesphere(.03, 5, 8, -.42368,-.66718,.61268);
	arc = makearc(0.91, Math.PI*0.48, 0, -Math.PI*0.48, 0, 16);
	setcities();

	tick();
}	


function drawtris(model)
{

	// Pass vertices
	vertexPosBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, model.verts, gl.STATIC_DRAW);
	triaprogram.vertexPosAttrib = gl.getAttribLocation(triaprogram, 'pos');
	gl.enableVertexAttribArray(triaprogram.vertexPosAttrib);
	gl.vertexAttribPointer(triaprogram.vertexPosAttrib, 3, gl.FLOAT, false, 0, 0);

	// Pass texture coords
	textPosBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textPosBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, model.texts, gl.STATIC_DRAW);
	triaprogram.tpos = gl.getAttribLocation(triaprogram, 'tex');
	gl.enableVertexAttribArray(triaprogram.tpos);
	gl.vertexAttribPointer(triaprogram.tpos, 2, gl.FLOAT, false, 0, 0);

	// Pass texture
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, text1);
	gl.uniform1i(gl.getUniformLocation(triaprogram, "uSampler"), 0);

	// Pas time
	triaprogram.timehandle = gl.getUniformLocation(triaprogram, "time");
	gl.uniform1f(triaprogram.timehandle, time);

	// Pass indices
	indices = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.trias, gl.STATIC_DRAW);

	// Draw
	gl.drawElements(gl.TRIANGLES, model.trial, gl.UNSIGNED_SHORT, 0);
}

function drawedges(model, width)
{

	// Check for width
	if(!width) width = 1;

	// Pass vertices
	vertexPosBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, model.verts, gl.STATIC_DRAW);
	edgeprogram.vertexPosAttrib = gl.getAttribLocation(edgeprogram, 'pos');
	gl.enableVertexAttribArray(edgeprogram.vertexPosAttrib);
	gl.vertexAttribPointer(edgeprogram.vertexPosAttrib, 3, gl.FLOAT, false, 0, 0);
	indices = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);

	gl.lineWidth(width);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.edges, gl.STATIC_DRAW);
	gl.drawElements(gl.LINES, model.edgel, gl.UNSIGNED_SHORT, 0);
}


function tick()
{
	time++;
	render();
	setTimeout(tick,30);
}

var cities = new Object();
function setcities()
{
	cities.ny = new Object();
	cities.fr = new Object();
	cities.ch = new Object();
	cities.as = new Object();
	cities.lo = new Object();
	cities.pa = new Object();
	cities.to = new Object();
	cities.hk = new Object();
	cities.si = new Object();
	cities.la = new Object();
	
	cities.ny.lat = 40.6700;
	cities.ny.lon = -73.9400;
	cities.fr.lat = 37.5483;
	cities.fr.lon = -121.9886;
	cities.ch.lat = 41.8819;
	cities.ch.lon = -87.6278;
	cities.as.lat = 39.8819;
	cities.as.lon = -77.4875;
	cities.lo.lat = 51.5072;
	cities.lo.lon = -0.1275;
	cities.pa.lat = 48.8567;
	cities.pa.lon = 2.3508;
	cities.to.lat = 35.6895;
	cities.to.lon = 139.6917;
	cities.hk.lat = 22.2783;
	cities.hk.lon = 114.1589;
	cities.si.lat = 1.3;
	cities.si.lon = 103.8000;
	cities.la.lat = 34.0500;
	cities.la.lon = -118.2500;
	cities.da = new Object();//dallas
	cities.da.lat = 32.7758;
	cities.da.lon = -96.7967;
	cities.de = new Object();//denver
	cities.de.lat = 39.7392;
	cities.de.lon = -104.9847;
	cities.ph = new Object();//phoenix
	cities.ph.lat = 33.4500;
	cities.ph.lon = -112.0667;
	cities.lv = new Object();//las vegas
	cities.lv.lat = 36.0800;
	cities.lv.lon = -115.1522;
	cities.at = new Object();//atlanta
	cities.at.lat = 33.7550;
	cities.at.lon = -84.3900;
	cities.mi = new Object();// miama
	cities.mi.lat = 25.7877;
	cities.mi.lon = -80.2241;
	/*
	cities. = new Object();//
	cities..lat = ;
	cities..lon = ;
	*/

	cities.arc = new Array();
	var i=0;
	cities.arc[i++] = arccities(cities.as, cities.ny);
	cities.arc[i++] = arccities(cities.ch, cities.as);
	cities.arc[i++] = arccities(cities.ch, cities.fr);
	cities.arc[i++] = arccities(cities.fr, cities.to);
	cities.arc[i++] = arccities(cities.to, cities.hk);
	cities.arc[i++] = arccities(cities.to, cities.si);
	cities.arc[i++] = arccities(cities.si, cities.hk);
	cities.arc[i++] = arccities(cities.ny, cities.lo);
	cities.arc[i++] = arccities(cities.as, cities.pa);
	cities.arc[i++] = arccities(cities.pa, cities.as);
	cities.arc[i++] = arccities(cities.la, cities.hk);
	cities.arc[i++] = arccities(cities.la, cities.ph);
	cities.arc[i++] = arccities(cities.ph, cities.da);
	cities.arc[i++] = arccities(cities.da, cities.at);
	cities.arc[i++] = arccities(cities.la, cities.fr);
	cities.arc[i++] = arccities(cities.da, cities.mi);
	cities.arc[i++] = arccities(cities.at, cities.mi);
	cities.arc[i++] = arccities(cities.at, cities.as);
	cities.arcs = i;
}


function render()
{
	// Generate and pass matrix
	var tc = Math.cos(time/400);
	var ts = Math.sin(time/400);
	//var mmat = new Float32Array([tc,0,-ts,0, 0,1,0,0, ts,0,tc,0, 0,0,0,1]);
	var mmat = new Float32Array([tc,ts,0,0, -ts,tc,0,0, 0,0,1,0, 0,0,0,1]);
	//var mmat = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
	setproj();
	mmat = matmult(projmatrix,mmat);

	gl.useProgram(triaprogram);
	triaprogram.testhandle = gl.getUniformLocation(triaprogram, "test");
	gl.uniformMatrix4fv(triaprogram.testhandle,false,mmat);

	// Draw
	triaprogram.colhandle = gl.getUniformLocation(triaprogram, "col");
	gl.uniform3f(triaprogram.colhandle, 0.4, 0.6, 1.0);

	drawtris(globe)

	gl.useProgram(edgeprogram);

	edgeprogram.testhandle = gl.getUniformLocation(edgeprogram, "test");
	gl.uniformMatrix4fv(edgeprogram.testhandle,false,mmat);
	
	edgeprogram.colhandle = gl.getUniformLocation(edgeprogram, "col");
	gl.uniform3f(edgeprogram.colhandle, 0.0, 1.0, 0.1);
	//drawedges(globe);

	//gl.uniform3f(edgeprogram.colhandle, 1.0, 0.0, 0.0);
	//drawtris(fr);

	//gl.uniform3f(edgeprogram.colhandle, 0.9, 0.9, 0.9);
	//drawedges(arc, 2);


	gl.uniform3f(edgeprogram.colhandle, 1.0, 0.0, 0.0);
	for(i=0;i<cities.arcs;i++)
	{
		drawedges(cities.arc[i], 3);
	}
}

function arccities(city2, city1)
{
	return makearc(0.91, city1.lat*Math.PI/180, city1.lon*Math.PI/180, city2.lat*Math.PI/180, city2.lon*Math.PI/180, 16);
}

function makearc(rad, lat1, lon1, lat2, lon2, res)
{
	var tmod = new Object();

	// Temp vars
	var i;
	var qw, qx, qy, qz;
	var xs, ys, zs, ws, xy, xz, xw, yz, yw, zw;
	var bx, by, bz;
	var c, s;

	// Make 3D coords from lats n longs
	var ct = Math.cos(lon1);
	var st = Math.sin(lon1);
	var cp = Math.cos(lat1);
	var sp = Math.sin(lat1);
	var p1x = ct*cp;
	var p1y = st*cp;
	var p1z = sp;
	ct = Math.cos(lon2);
	st = Math.sin(lon2);
	cp = Math.cos(lat2);
	sp = Math.sin(lat2);
	var p2x = ct*cp;
	var p2y = st*cp;
	var p2z = sp;

	// Axis of rotation
	var ax = p1y*p2z - p1z*p2y
	var ay = p1z*p2x - p1x*p2z
	var az = p1x*p2y - p1y*p2x
	var rmag = Math.sqrt(ax*ax+ay*ay+az*az);
	if(rmag>0) var rmag = 1/rmag;
	else { ax=1; rmag = 1; }
	ax*= rmag;
	ay*= rmag;
	az*= rmag;

	// Angle of rotation
	var theta = Math.acos(p1x*p2x + p1y*p2y + p1z*p2z);
	var theta2;
	var joints = Math.round(theta/Math.PI*res+1)+1;
	if(joints<2) joints = 2;

	// Create vertex array
	tmod.vertl = 3*joints;
	tmod.verts = new Float32Array(tmod.vertl);

	// Populate vertex array
	for(i=0;i<joints;i++)
	{
		theta2 = i*theta/(joints-1)/2;
		c = Math.cos(theta2);
		s = Math.sin(theta2);
		qw = c;
		qx = s*ax;
		qy = s*ay;
		qz = s*az;

		xs = qx*qx;
		ys = qy*qy;
		zs = qz*qz;
		ws = qw*qw;
		xy = 2*qx*qy;
		xz = 2*qx*qz;
		xw = 2*qx*qw;
		yz = 2*qy*qz;
		yw = 2*qy*qw;
		zw = 2*qz*qw;

		tmod.verts[3*i+0] = rad*((xs+ws-ys-zs)*p1x+(xy-zw)*p1y+(xz+yw)*p1z);
		tmod.verts[3*i+1] = rad*((xy+zw)*p1x+(ws-xs+ys-zs)*p1y+(yz-xw)*p1z);
		tmod.verts[3*i+2] = rad*((xz-yw)*p1x+(yz+xw)*p1y+(ws-xs-ys+zs)*p1z);

	}

	// Create edge array
	tmod.edgel = 2*joints-2;
	tmod.edges = new Uint16Array(tmod.edgel);

	// Populate edge array
	for(i=0;i<joints-1;i++)
	{
		tmod.edges[2*i+0] = i;
		tmod.edges[2*i+1] = i+1;
	}

	return tmod;
}


function makesphere(rad, lats, lons, px, py, pz)
{
	var tmod = new Object();

	var lonsi = lons+1;
	var i,j;
	var temp, temp2;
	var ct,st,cp,sp;

	// Populate Vertices
	tmod.vertl = 3*(lats*lonsi+2*lons);
	tmod.verts = new Float32Array(tmod.vertl);
	tmod.textl = tmod.vertl/3*2;
	tmod.texts = new Float32Array(tmod.textl);
	for(j=0;j<lats;j++)
	{
		temp = (j+1)*Math.PI/(lats+1);
		cp = Math.cos(temp);
		sp = Math.sin(temp);
		for(i=0;i<lonsi;i++)
		{
			temp = 2*Math.PI*i/lons;
			ct = Math.cos(temp);
			st = Math.sin(temp);
			tmod.verts[3*(i+j*lonsi)+0] = rad*ct*sp + px;
			tmod.verts[3*(i+j*lonsi)+1] = rad*st*sp + py;
			tmod.verts[3*(i+j*lonsi)+2] = rad*cp + pz;
			tmod.texts[2*(i+j*lonsi)+0] = i/lons+.5;
			tmod.texts[2*(i+j*lonsi)+1] = (j+1)/(lats+1);
		}
	}
	temp = lats*lonsi
	temp2 = temp+lons;
	for(i=0;i<lons;i++)
	{
		tmod.verts[3*(temp+i)+0] = 0;	
		tmod.verts[3*(temp+i)+1] = 0;	
		tmod.verts[3*(temp+i)+2] = rad;
		tmod.texts[2*(temp+i)+0] = i/lons+.5;
		tmod.texts[2*(temp+i)+1] = 0.0;
		tmod.verts[3*(temp2+i)+0] = 0;	
		tmod.verts[3*(temp2+i)+1] = 0;	
		tmod.verts[3*(temp2+i)+2] = -rad;	
		tmod.texts[2*(temp2+i)+0] = i/lons+.5;
		tmod.texts[2*(temp2+i)+1] = 1.0;
	}

	// Populate Edges
	tmod.edgel = 2*lons*(2*lats+1);
	//tmod.edgel = 2*lons*(2*lats-1); // FLAG
	tmod.edges = new Uint16Array(tmod.edgel);
	for(j=0;j<lats;j++)
	{
		for(i=0;i<lonsi;i++)
		{
			tmod.edges[2*(i+j*lons)+0] = i+j*lonsi;
			tmod.edges[2*(i+j*lons)+1] = i+j*lonsi+1;
		}
	}
	temp = 2*lons*lats;
	for(j=0;j<lats-1;j++)
	{
		for(i=0;i<lons;i++)
		{
			temp2 = 2*(i+j*lons)+temp;
			tmod.edges[temp2+0] = i+j*lonsi;
			tmod.edges[temp2+1] = i+(j+1)*lonsi;
		}
	}
	temp = 2*(lons*(2*lats-1));
	temp2 = temp+2*lons;
	for(i=0;i<lons;i++)
	{
		tmod.edges[temp+2*i+0] = i;
		tmod.edges[temp+2*i+1] = lats*lonsi+i;
		tmod.edges[temp2+2*i+0] = i+lonsi*(lats-1);
		tmod.edges[temp2+2*i+1] = lats*lonsi+lons+i;
	}

	// Populate Triangles
	tmod.trial = 6*lons*lats;
	//tmod.trial = 6*lons*(lats-1); // FLAG no poles
	tmod.trias = new Uint16Array(tmod.trial);
	for(j=0;j<lats-1;j++)
	{
		for(i=0;i<lons;i++)
		{
			temp2 = 6*(i+j*lons);
			tmod.trias[temp2+0] = i+j*lonsi;
			tmod.trias[temp2+1] = i+(j+1)*lonsi;
			tmod.trias[temp2+2] = i+1+j*lonsi;
			tmod.trias[temp2+3] = i+1+(j+1)*lonsi;
			tmod.trias[temp2+4] = i+1+j*lonsi;
			tmod.trias[temp2+5] = i+(j+1)*lonsi;
		}
	}
	temp = (lats-1)*lons;
	for(i=0;i<lons;i++)
	{
		temp2 = 6*temp+3*i;
		tmod.trias[temp2+0] = i;
		tmod.trias[temp2+1] = i+1;
		tmod.trias[temp2+2] = lats*lonsi+i;
		temp2+= 3*lons;
		tmod.trias[temp2+0] = (lats-1)*lonsi+i;
		tmod.trias[temp2+1] = (lats-1)*lonsi+1+i;
		tmod.trias[temp2+2] = lats*lonsi+lons+i;
	}

		
	return tmod;
}

function setproj()
{
	// rotates view by theta and phi, then pulls camera back by dist and encloses origin in a frustrum that's ~2*rad wide

	var ct = Math.cos(td_theta);
	var st = Math.sin(td_theta);
	var cp = Math.cos(td_phi);
	var sp = Math.sin(td_phi);
	var dist = 10;
	var rad = 1;
	var pm = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);

	pm[0] = ct;
	pm[1] = st*cp
	pm[2] = st*sp;
	pm[3] = 0;
	pm[4] = -st;
	pm[5] = ct*cp;
	pm[6] = ct*sp;
	pm[7] = 0;
	pm[8] = 0;
	pm[9] = -sp;
	pm[10] = cp;
	pm[11] = 0;
	pm[12] = 0;//oy*st - ox*ct;//ox*ct - oy*st;
	pm[13] = 0;//cp*t + oz*sp;
	pm[14] = -dist;//sp*t - oz*cp;
	pm[15] = 1;
	
	tw = (1-rad/dist)*rad*winwidth/winheight;
	th = (1-rad/dist)*rad;
	tn = dist-rad;
	tf = dist+rad;
	projmatrix = new Float32Array([tn/tw,0,0,0, 0,tn/th,0,0, 0,0,(tf+tn)/(tn-tf),-1, 0,0,2*tf*tn/(tn-tf),0]);
	//projmatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
	projmatrix = matmult(projmatrix,pm);
}
//*
function transpose(mi)
{
	var mo = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
	var i,j;

	for(i=0;i<4;i++)
	{
		for(j=0;j<4;j++)
		{
			mo[j+4*i] = mi[i+4*j];
		}
	}
	return mo;
}
//*/
function matmult(m1,m2)
{
	var m3 = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
	var i,j;

	for(i=0;i<4;i++)
	{
		for(j=0;j<4;j++)
		{
			m3[i+j*4] = m1[i+0*4]*m2[0+j*4] + m1[i+1*4]*m2[1+j*4] + m1[i+2*4]*m2[2+j*4] + m1[i+3*4]*m2[3+j*4];
		}
	}
	return m3;
}



function createProgram(vstr, fstr) {
	var program = gl.createProgram();
	var vshader = createShader(vstr, gl.VERTEX_SHADER);
	var fshader = createShader(fstr, gl.FRAGMENT_SHADER);
	gl.attachShader(program, vshader);
	gl.attachShader(program, fshader);
	gl.linkProgram(program);
	return program;
}

function createShader(str, type) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, str);
	gl.compileShader(shader);
	return shader;
}
/*
var td_windowWidth=800;
var td_windowHeight=600;
var td_theta = -Math.PI/4;
var td_phi = -Math.PI*5/16;

$(document).ready(function()
{
	$("#gldisplay").append("<canvas id=\"td_canvas\"></canvas>");
	var cj = $("#td_canvas");
	cj.attr("width",td_windowWidth);
	cj.attr("height",td_windowHeight);
	cj.css("border","1px solid #000000");

	var c = document.getElementById("td_canvas");
	var gl = cj.getContext("experimental-webgl");
	gl.clearColor( 0, 0, .8, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
});


/*
var td_windowWidth=800;
var td_windowHeight=600;
var td_theta = -Math.PI/4;
var td_phi = -Math.PI*5/16;

$(document).ready(function()
{
	$("#gldisplay").append("<canvas id=\"td_canvas\"></canvas>");
	$("#gldisplay").append("<br>Click to rotate ");
	$("#gldisplay").append("<button id=\"td_turnl\">&lt;-</button>");
	$("#gldisplay").append("<div style=\"display:inline-block\"><div><button id=\"td_turnu\">^</button></div><div><button id=\"td_turnd\">v</button></div></div>");
	$("#gldisplay").append("<button id=\"td_turnr\">-&gt;</button>");

	$("#td_turnl").click(function(){td_theta+=Math.PI/32;td_render()});
	$("#td_turnr").click(function(){td_theta-=Math.PI/32;td_render()});
	$("#td_turnu").click(function(){td_phi+=Math.PI/16;if(td_phi>Math.PI/2)td_phi=Math.PI/2;td_render()});
	$("#td_turnd").click(function(){td_phi-=Math.PI/16;if(td_phi<-Math.PI/2)td_phi=-Math.PI/2;td_render()});
	var cj = $("#td_canvas");
	cj.attr("width",td_windowWidth);
	cj.attr("height",td_windowHeight);
	cj.css("border","1px solid #000000");

	td_render();
});

function td_render()
{
	
	var c = document.getElementById("td_canvas");
	var ctx = c.getContext("2d");

	var ct = Math.cos(td_theta);
	var st = Math.sin(td_theta);
	var cp = Math.cos(td_phi);
	var sp = Math.sin(td_phi);
	var dist = 15;
	var pm = new Array();
	pm[0] = ct;
	pm[1] = st*cp
	pm[2] = st*sp;
	pm[3] = 0;
	pm[4] = -st;
	pm[5] = ct*cp;
	pm[6] = ct*sp;
	pm[7] = 0;
	pm[8] = 0;
	pm[9] = -sp;
	pm[10] = cp;
	pm[11] = 0;
	pm[12] = 0;//oy*st - ox*ct;//ox*ct - oy*st;
	pm[13] = 0;//cp*t + oz*sp;
	pm[14] = -dist;//sp*t - oz*cp;
	pm[15] = 1;
	tw = .1;
	th = .1;
	tn = .2*dist;
	tf = 1.8*dist;
	pm = td_matmult(new Array(tn/tw,0,0,0, 0,tn/th,0,0, 0,0,-(tf+tn)/(tf-tn),-1, 0,0,-2*tf*tn/(tf-tn),0),pm); // FLAG properly finish, in case eventually using z for depth buffer
	t = td_windowHeight/2 / 4; // Scale factor
	pm = td_matmult(new Array(t,0,0,0, 0,-t,0,0, 0,0,1,0, td_windowWidth/2,td_windowHeight/2,0,1),pm);

	ctx.clearRect(0, 0, c.width, c.height);




	var longitudes = 8;
	var latitudes = 7;
	var resolution = 32;

	// fresh vert arrays
	var vertx = new Array(1,0,0);
	var verty = new Array(0,1,1);
	var vertz = new Array(0,0,1);


	

	// Draw Sphere FLAG set to function
	ctx.lineWidth = 1;
	ctx.strokeStyle = "rgb(0,0,0)";

	// Draw longitudes
	for(i=0;i<longitudes;i++)
	{
		theta = i*Math.PI/longitudes;
		ct = Math.cos(theta);
		st = Math.sin(theta);
		ctx.beginPath();
		for(j=0;j<=resolution;j++)
		{
			phi = j*2*Math.PI/resolution;
			cp = Math.cos(phi);
			sp = Math.sin(phi);

			bx = ct*cp;
			by = st*cp;
			bz = sp;
			tx = bx*pm[0] + by*pm[4] + bz*pm[8] + pm[12];
			ty = bx*pm[1] + by*pm[5] + bz*pm[9] + pm[13];
			tz = bx*pm[2] + by*pm[6] + bz*pm[10] + pm[14];
			tw    = bx*pm[3] + by*pm[7] + bz*pm[11] + pm[15];
			tx/= tw;
			ty/= tw;
			tz/= tw;
			//if(j==0) ctx.moveTo(tx,ty);
			//else ctx.lineTo(tx,ty);
			tw = 255 - Math.round(255*((1-tz)-.18)*20)
			ctx.strokeStyle = "rgb("+tw+","+tw+","+tw+")";
			if(j==0) ctx.moveTo(tx,ty);
			else ctx.lineTo(tx,ty);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(tx,ty);
		}
		ctx.stroke();
	}

	// Draw latitudes
	for(i=0;i<latitudes;i++)
	{
		phi = (i+1)*Math.PI/(latitudes+1)-Math.PI/2;
		cp = Math.cos(phi);
		sp = Math.sin(phi);
		ctx.beginPath();
		for(j=0;j<=resolution;j++)
		{
			theta = j*2*Math.PI/resolution;
			ct = Math.cos(theta);
			st = Math.sin(theta);

			bx = ct*cp;
			by = st*cp;
			bz = sp;
			tx = bx*pm[0] + by*pm[4] + bz*pm[8] + pm[12];
			ty = bx*pm[1] + by*pm[5] + bz*pm[9] + pm[13];
			tz = bx*pm[2] + by*pm[6] + bz*pm[10] + pm[14];
			tw    = bx*pm[3] + by*pm[7] + bz*pm[11] + pm[15];
			tx/= tw;
			ty/= tw;
			tz/= tw;
			tw = 255 - Math.round(255*((1-tz)-.18)*20)
			ctx.strokeStyle = "rgb("+tw+","+tw+","+tw+")";
			if(j==0) ctx.moveTo(tx,ty);
			else ctx.lineTo(tx,ty);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(tx,ty);
		}
		ctx.stroke();
	}

	
	
	var ny = new Array(.20983,-.72887,.65170);
	//var p2 = new Array(.72887,.20983,.65170);
	var sf = new Array(-.42368,-.66718,.61268);
	var lo = new Array(.62241, .00139, .78269);
	var ct = new Array(.78724, .26224, -.55811);
	var ba = new Array(.43152, -.70092, -.56789);
	var sy = new Array(-.72776, .3991, -.55717);
	var to = new Array(-.61936, .52541, .58339);


	//drawarc(ctx,pm, new Array(0,0,1), new Array(0, 1, 0), Math.PI, 16);
	arcto(ctx,pm, ny, sf);
	arcto(ctx,pm, ny, ba);
	arcto(ctx,pm, ba, sf);
	arcto(ctx,pm, ny, lo);
	arcto(ctx,pm, ba, ct);
	arcto(ctx,pm, lo, ct);
	arcto(ctx,pm, sy, sf);
	arcto(ctx,pm, sy, ct);
	arcto(ctx,pm, sy, to);
	arcto(ctx,pm, sf, to);


	var tvx = new Array();
	var tvy = new Array();
	var tvz = new Array();

	for(i=0;i<4;i++)
	{
		bx = vertx[i];
		by = verty[i];
		bz = vertz[i];

		tvx[i] = bx*pm[0] + by*pm[4] + bz*pm[8] + pm[12];
		tvy[i] = bx*pm[1] + by*pm[5] + bz*pm[9] + pm[13];
		tvz[i] = bx*pm[2] + by*pm[6] + bz*pm[10] + pm[14];
		tvw    = bx*pm[3] + by*pm[7] + bz*pm[11] + pm[15];
		tvx[i]/= tvw;
		tvy[i]/= tvw;
		tvz[i]/= tvw;
	}

	ctx.strokeStyle = "rgb(150,150,0)";

}

function arcto(ctx, pm, point1, point2)
{
	// Get rotation axis
	var ax = point1[1]*point2[2] - point1[2]*point2[1];
	var ay = point1[2]*point2[0] - point1[0]*point2[2];
	var az = point1[0]*point2[1] - point1[1]*point2[0];
	var mag = Math.sqrt(ax*ax+ay*ay+az*az);
	ax/= mag;
	ay/= mag;
	az/= mag;

	// Get angle
	theta = Math.acos(point1[0]*point2[0] + point1[1]*point2[1] + point1[2]*point2[2]);
	res   = Math.round(theta/Math.PI*16);

	drawarc(ctx, pm, point1, new Array(ax,ay,az), theta, res);
}

function drawarc(ctx, pm, point, axis, angle, resolution)
{


	ctx.strokeStyle = "rgb(255,0,0)";
	ctx.lineWidth = 3;

	bx = point[0];
	by = point[1];
	bz = point[2];
	tx = bx*pm[0] + by*pm[4] + bz*pm[8] + pm[12];
	ty = bx*pm[1] + by*pm[5] + bz*pm[9] + pm[13];
	tz = bx*pm[2] + by*pm[6] + bz*pm[10] + pm[14];
	tw    = bx*pm[3] + by*pm[7] + bz*pm[11] + pm[15];
	tx/= tw;
	ty/= tw;
	tz/= tw;
	ctx.beginPath();
	ctx.moveTo(tx,ty);

	for(i=0;i<resolution;i++)
	{
		theta2 = (i+1)*angle/resolution/2;
		c = Math.cos(theta2);
		s = Math.sin(theta2);
		qw = c;
		qx = s*axis[0];
		qy = s*axis[1];
		qz = s*axis[2];

		xs = qx*qx;
		ys = qy*qy;
		zs = qz*qz;
		ws = qw*qw;
		xy = 2*qx*qy;
		xz = 2*qx*qz;
		xw = 2*qx*qw;
		yz = 2*qy*qz;
		yw = 2*qy*qw;
		zw = 2*qz*qw;

		bx = (xs+ws-ys-zs)*point[0]+(xy-zw)*point[1]+(xz+yw)*point[2];
		by = (xy+zw)*point[0]+(ws-xs+ys-zs)*point[1]+(yz-xw)*point[2];
		bz = (xz-yw)*point[0]+(yz+xw)*point[1]+(ws-xs-ys+zs)*point[2];

		tx = bx*pm[0] + by*pm[4] + bz*pm[8] + pm[12];
		ty = bx*pm[1] + by*pm[5] + bz*pm[9] + pm[13];
		tz = bx*pm[2] + by*pm[6] + bz*pm[10] + pm[14];
		tw = bx*pm[3] + by*pm[7] + bz*pm[11] + pm[15];
		tx/= tw;
		ty/= tw;
		tz/= tw;
		ctx.strokeStyle = "rgb("+Math.round(255*((1-tz)-.18)*20)+",0,0)";
		ctx.lineTo(tx,ty);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(tx,ty);

	}
}
// leftovers from transdisp

/*
var td_windowWidth=400;
var td_windowHeight=200;
var td_theta = -Math.PI/4;
var td_phi = -Math.PI*5/16;
var td_initialized = 0;
var td_modelmatrix = new Array();
var td_m = new Object(); // holds data for current model
*/
/*
function td_init()
{
	td_initialized = 1;
	$("#transformationdisplay").append("<canvas id=\"td_canvas\"></canvas>");
	$("#transformationdisplay").append("<br>Click to rotate ");
	$("#transformationdisplay").append("<button id=\"td_turnl\">&lt;-</button>");
	$("#transformationdisplay").append("<div style=\"display:inline-block\"><div><button id=\"td_turnu\">^</button></div><div><button id=\"td_turnd\">v</button></div></div>");
	$("#transformationdisplay").append("<button id=\"td_turnr\">-&gt;</button>");
	if(1) // FLAG add some sort of option to determine if animations allowed or not
	{
		$("#td_canvas").after("<div id=\"td_clockui\" style=\"border-radius:10px;display:inline-block;width:250px;height:150px;background-color:red;margin-left:30px;\"></div>");
		$("#td_clockui").append("Animation Time:");
		$("#td_clockui").append("<input id=\"td_clockuit\" type=\"test\" style=\"width:40px;\" value=\"1\"/><br><br>");
		$("#td_clockui").append("Loop Animation:");
		$("#td_clockui").append("<input id=\"td_clockuil\" type=\"checkbox\"/><br><br>");
		$("#td_clockui").append("&nbsp;<button id=\"td_clockuis\" style=\"width:60px;\">Start</button> ");
		$("#td_clockui").append("<button id=\"td_clockuir\">Reset</button>");
		$("#td_clockui").append("<div id=\"td_clockuii\"style=\"background-color:#ffffdd;margin-left:20px;border-style:solid;border-radius:7px;width:1em;height:1em;text-align:center;cursor:default;\"><b>?</b></div>");
		$("#td_clockuii").attr("title","If you'd like to see an animated transformation, use the letter 't' as a value in the cells of the matrices below to represent animation phase. When you hit \"Start\", the value of 't' will shift from 0 to 1 over the course of the animation.\n\"Animation Time\" determines how long, in seconds, an animation takes.\n\"Loop Animation\" determines if animation repeats, or just executes once and then stops.\nPress \"Start\" to start an animation.\nPress \"Reset\" to stop an animation and set 't' to zero.");
	}

	$("#td_turnl").click(function(){td_theta+=Math.PI/8;td_update()});
	$("#td_turnr").click(function(){td_theta-=Math.PI/8;td_update()});
	$("#td_turnu").click(function(){td_phi+=Math.PI/16;if(td_phi>Math.PI/2)td_phi=Math.PI/2;td_update()});
	$("#td_turnd").click(function(){td_phi-=Math.PI/16;if(td_phi<-Math.PI/2)td_phi=-Math.PI/2;td_update()});

	var cj = $("#td_canvas");
	cj.attr("width",td_windowWidth);
	cj.attr("height",td_windowHeight);
	cj.css("border","1px solid #000000");

	td_update(new Array(.2,0,0,0, 0,.2,0,0, 0,0,.2,0, 0,0,0,1));
}

function td_update(am,pm)
{

	// Initialize if it hasn't been done already FLAG maybe this isn't necessary... just have init called in mmt before any td_update calls... since td relies on mmt anyway
	if(!td_initialized) td_init();

	// am : "argument matrix"; 16 length number array
	var i,j,t;
	var bx,by,bz;
	var e0,e1;
	var c = document.getElementById("td_canvas");
	var ctx = c.getContext("2d");

	var vertices;
	var vertx = new Array(0, 1, 0, 0);
	var verty = new Array(0, 0, 1, 0);
	var vertz = new Array(0, 0, 0, 1);
	var vertc = new Array(0x800080, 0xff0000, 0x00ff00,0x0000ff);
	vertices = vertx.length;

	var tvx = new Array(); // holds transformed vertices
	var tvy = new Array();
	var tvz = new Array();
	var tvw;

	var edges;
	var edgev0 = new Array(0,0,0);
	var edgev1 = new Array(1,2,3);
	var edgec = new Array(0xff0000,0xff00,0xff);
	edges = edgev0.length;

	td_loadmodel(1);

	if(td_m.verts)
	{
		var temp = td_m.verts;
		vertices = temp.length/3;
		for(i=0;i<vertices;i++)
		{
			vertx[i] = temp[0+3*i];
			verty[i] = temp[1+3*i];
			vertz[i] = temp[2+3*i];
			vertc[i] = td_m.vcols[i];
		}
		temp = td_m.edges;
		edges = temp.length/2;
		for(i=0;i<edges;i++)
		{
			edgev0[i] = temp[0+2*i];
			edgev1[i] = temp[1+2*i];
			edgec[i]  = td_m.ecols[i];
		}
	}

	// Check if modelmatrix passed: save to memory if so, populate from memory if not
	if(!am)
	{
		am = new Array();
		for(i=0;i<16;i++)
		{
			am[i] = td_modelmatrix[i];
		}
	}
	else
	{
		for(i=0;i<16;i++)
		{
			td_modelmatrix[i] = am[i];
		}
	}

	// Check if perspective matrix passed, and generate if not
	if(!pm)
	{
		
		//*

		var ct = Math.cos(td_theta);
		var st = Math.sin(td_theta);
		var cp = Math.cos(td_phi);
		var sp = Math.sin(td_phi);
		var dist = 15;

		var pm = new Array();

		pm[0] = ct;
		pm[1] = st*cp
		pm[2] = st*sp;
		pm[3] = 0;
		pm[4] = -st;
		pm[5] = ct*cp;
		pm[6] = ct*sp;
		pm[7] = 0;
		pm[8] = 0;
		pm[9] = -sp;
		pm[10] = cp;
		pm[11] = 0;
		pm[12] = 0;//oy*st - ox*ct;//ox*ct - oy*st;
		pm[13] = 0;//cp*t + oz*sp;
		pm[14] = -dist;//sp*t - oz*cp;
		pm[15] = 1;

		tw = .1;
		th = .1;
		tn = .2*dist;
		tf = 1.8*dist;
		pm = td_matmult(new Array(tn/tw,0,0,0, 0,tn/th,0,0, 0,0,1,-tn, 0,0,0,0),pm); // FLAG properly finish, in case eventually using z for depth buffer

	}


	t = td_windowHeight/2 / 7; // Scale factor
	t*=1.7; // FLAG delete me, just temp to adjust size of .5 width grid
	pm = td_matmult(new Array(t,0,0,0, 0,-t,0,0, 0,0,1,0, td_windowWidth/2,td_windowHeight/2,0,1),pm);
	am = td_matmult(pm,am);
	for(i=0;i<vertices;i++)
	{
		bx = vertx[i];
		by = verty[i];
		bz = vertz[i];

		tvx[i] = bx*am[0] + by*am[4] + bz*am[8] + am[12];
		tvy[i] = bx*am[1] + by*am[5] + bz*am[9] + am[13];
		tvz[i] = bx*am[2] + by*am[6] + bz*am[10] + am[14];
		tvw    = bx*am[3] + by*am[7] + bz*am[11] + am[15];
		tvx[i]/= tvw;
		tvy[i]/= tvw;
		tvz[i]/= tvw;
		
		//tvx[i]*= t;
		//tvy[i]*= -t;
		//tvx[i]+= td_windowWidth/2;
		//tvy[i]+= td_windowHeight/2
	}



	// Clear canvas
	ctx.clearRect(0, 0, c.width, c.height);

	// Determine order in which to render grid and model
	var order;
	if(am[14]>0) order = 1;// If model's center is below grid
	else order = 0;	
	
	while(order<4)
	{
		switch(order)
		{
			case 0: case 3:
			// Render grid
			t = 5; // number of gridlines to draw
			ctx.strokeStyle = "rgb(150,150,150)";
			for(i=-t;i<=t;i++)
			{
				
				ctx.beginPath();
				tvw = -t*pm[3] + i*pm[7] + 0*pm[11] + pm[15];
				ctx.moveTo((-t*pm[0]+i*pm[4]+pm[12])/tvw,(-t*pm[1]+i*pm[5]+pm[13])/tvw);
				tvw = t*pm[3] + i*pm[7] + 0*pm[11] + pm[15];
				ctx.lineTo((t*pm[0]+i*pm[4]+pm[12])/tvw,(t*pm[1]+i*pm[5]+pm[13])/tvw);
				ctx.stroke();
				ctx.beginPath();
				tvw = i*pm[3] - t*pm[7] + 0*pm[11] + pm[15];
				ctx.moveTo((i*pm[0]-t*pm[4]+pm[12])/tvw,(i*pm[1]-t*pm[5]+pm[13])/tvw);
				tvw = i*pm[3] + t*pm[7] + 0*pm[11] + pm[15];
				ctx.lineTo((i*pm[0]+t*pm[4]+pm[12])/tvw,(i*pm[1]+t*pm[5]+pm[13])/tvw);
				//ctx.moveTo(i*pm[0]-t*pm[4]+pm[12],i*pm[1]-t*pm[5]+pm[13]);
				//ctx.lineTo(i*pm[0]+t*pm[4]+pm[12],i*pm[1]+t*pm[5]+pm[13]);
				ctx.stroke();
			}
			ctx.strokeStyle = "rgb(0,0,0)";
			i=0;
			ctx.beginPath();
			ctx.moveTo(-t*pm[0]+i*pm[4]+pm[12],-t*pm[1]+i*pm[5]+pm[13]);
			ctx.lineTo(t*pm[0]+i*pm[4]+pm[12],t*pm[1]+i*pm[5]+pm[13]);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(i*pm[0]-t*pm[4]+pm[12],i*pm[1]-t*pm[5]+pm[13]);
			ctx.lineTo(i*pm[0]+t*pm[4]+pm[12],i*pm[1]+t*pm[5]+pm[13]);
			ctx.stroke();
			break;

			case 1: case 2:
			// Render Vertices
			for(i=0;i<vertices;i++)
			{
				// maybe assign to "object"/hash with z values as key, and draw in reverse order for proper overlap
				t = vertc[i];
				ctx.fillStyle = "rgb("+((t&0xff0000)>>16)+","+((t&0xff00)>>8)+","+(t&0xff)+")";
				ctx.fillRect(tvx[i]-2,tvy[i]-2,4,4);
			}

			// Render Edges
			for(i=0;i<edges;i++)
			{
				e0 = edgev0[i];
				e1 = edgev1[i];
				t = edgec[i];
				ctx.strokeStyle = "rgb("+((t&0xff0000)>>16)+","+((t&0xff00)>>8)+","+(t&0xff)+")";
				ctx.beginPath();
				ctx.moveTo(tvx[e0],tvy[e0])
				ctx.lineTo(tvx[e1],tvy[e1])
				ctx.stroke();
			}
			break;
		}
		order+=2;
	}

}

function td_matmult(m1,m2)
{
	var m3 = new Array();
	var i,j;

	for(i=0;i<4;i++)
	{
		for(j=0;j<4;j++)
		{
			m3[i+j*4] = m1[i+0*4]*m2[0+j*4] + m1[i+1*4]*m2[1+j*4] + m1[i+2*4]*m2[2+j*4] + m1[i+3*4]*m2[3+j*4];
		}
	}
	return m3;
}

function td_loadmodel(model)
{
	switch(model)
	{
		case 0:
			break;
		case 1:
			td_m.verts = new Array(1,1,1, -1,1,1, -1,-1,1, 1,-1,1, 1,1,-1, -1,1,-1, -1,-1,-1, 1,-1,-1);
			td_m.edges = new Array(0,1, 1,2, 2,3, 3,0, 4,5, 5,6, 6,7, 7,4, 0,4, 1,5, 2,6, 3,7)
			td_m.vcols = new Array(0x0000FF, 0xFF0000, 0xFF0000, 0xFF0000, 0xFF0000, 0xFF0000, 0xFF0000, 0xFF0000);
			td_m.ecols = new Array(0x0000FF, 0xFF0000, 0xFF0000, 0xFF0000, 0xFF0000, 0xFF0000, 0xFF0000, 0xFF0000, 0xFF0000, 0xFF0000, 0xFF0000, 0xFF0000);
			break;

		case 2:
			break;
	}
}


/*
void quatrot(float* am, quaternion q)
{
	// Produces rotation matrix from passed quaternion

	float xs = q.x*q.x;
	float ys = q.y*q.y;
	float zs = q.z*q.z;
	float ws = q.w*q.w;
	float xy = 2.0f*q.x*q.y;
	float xz = 2.0f*q.x*q.z;
	float xw = 2.0f*q.x*q.w;
	float yz = 2.0f*q.y*q.z;
	float yw = 2.0f*q.y*q.w;
	float zw = 2.0f*q.z*q.w;

	am[0] = xs + ws - ys - zs;
	am[1] = xy + zw;
	am[2] = xz - yw;
	am[3] = 0;
	am[4] = xy - zw;
	am[5] = ws - xs + ys - zs;
	am[6] = yz + xw;
	am[7] = 0;
	am[8] = xz + yw;
	am[9] = yz - xw;
	am[10] = ws - xs - ys + zs;
	am[11] = 0;
	am[12] = 0;
	am[13] = 0;
	am[14] = 0;
	am[15] = 1;
}


quaternion vectoquat(float x, float y, float z, float theta)
{
	// Converts a rotation vector and angle to a normalized quaternion

	float c;
	float s;
	float t2;
	float mag;
	quaternion tempq;

	t2 = theta/2;

	c = cos(t2);
	s = sin(t2);
	
	mag = sqrt(x*x + y*y + z*z);
	if(mag<=0){ mag=1; x=y=z=0; }

	tempq.w = c;
	tempq.x = s*x/mag;
	tempq.y = s*y/mag;
	tempq.z = s*z/mag;

	return tempq;
}
*/
