/**
 * @author lee688@illinois.edu (Byungsuk Lee)
 * Comments added only to the variables and functions that are newly added and/or altered.
 * Original template from HelloTerrain.js provided on the course website. 
 */



var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

// Create a place to store terrain geometry
var tVertexPositionBuffer;

//Create a place to store terrain normals for shading
var tVertexNormalBuffer;

// Create a place to store the terrain triangles
var tIndexTriBuffer;

//Create a place to store the traingle edges
var tIndexEdgeBuffer;

//Create a place to store the terrain colors
var tVertexColorBuffer;

// Create a place to store sphere geometry
var sphereVertexPositionBuffer;

//Create a place to store sphere normals for shading
var sphereVertexNormalBuffer;

//Create a place to store the sphere colors 
var sphereVertexColorBuffer;

// View (or camera, or airplane) parameters
var eyeSpeed = 0.0;
var eyePt = vec3.fromValues(0.0,0.0,30.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);
var viewX = vec3.fromValues(1.0,0.0,0.0);

//// Quaternion-based camera rotation variables
var cameraRotation = quat.fromValues(0,0,0,1);
var rotAngle=0.5;

// Distance variables from four sphere obstacles for collision detection
var distance1 = 0;
var distance2 = 0;
var distance3 = 0;
var distance4 = 0;

// Create the normal
var nMatrix = mat3.create();

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

var mvMatrixStack = [];



// Set up the terrain buffers using terrainFromIteration function from MP2terrainModeling
var terrainSize = 10;
function setupTerrainBuffers() 
{    
    var vTerrain=[];
    var fTerrain=[];
    var nTerrain=[];
    var eTerrain=[];
    var tColors=[];
    var gridN=Math.pow(2,7);
    
    // Generate the vertex array, the triangular face array, normal array and the color array for the terrain. 
    var numT = terrainFromIteration(gridN, -terrainSize,terrainSize,-terrainSize,terrainSize, terrainSize/2, vTerrain, fTerrain, nTerrain, tColors);
    
    console.log("Generated ", numT, " triangles"); 
    tVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTerrain), gl.STATIC_DRAW);
    tVertexPositionBuffer.itemSize = 3;
    tVertexPositionBuffer.numItems = (gridN+1)*(gridN+1);
    
    // Specify normals to be able to do lighting calculations
    tVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nTerrain),
                  gl.STATIC_DRAW);
    tVertexNormalBuffer.itemSize = 3;
    tVertexNormalBuffer.numItems = (gridN+1)*(gridN+1);
    
    //Specify the height-dependent terrain color
    tVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tColors),
                  gl.STATIC_DRAW);
    tVertexColorBuffer.itemSize = 3;
    tVertexColorBuffer.numItems = (gridN+1)*(gridN+1);
    
    // Specify faces of the terrain 
    tIndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(fTerrain),
                  gl.STATIC_DRAW);
    tIndexTriBuffer.itemSize = 1;
    tIndexTriBuffer.numItems = numT*3;
    
    //Setup Edges
    generateLinesFromIndexedTriangles(fTerrain,eTerrain);  
    tIndexEdgeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(eTerrain),
                  gl.STATIC_DRAW);
    tIndexEdgeBuffer.itemSize = 1;
    tIndexEdgeBuffer.numItems = eTerrain.length;
}



// Draw terrain
function drawTerrain() 
{
    gl.polygonOffset(0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                           gl.FLOAT, false, 0, 0);
    
    // Bind normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           tVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
    // Bind color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                           tVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    //Draw 
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
    gl.drawElements(gl.TRIANGLES, tIndexTriBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}



//Draw terrain edges (not used in this MP)
function drawTerrainEdges()
{
    gl.polygonOffset(1,1);
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                           gl.FLOAT, false, 0, 0);

    // Bind normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           tVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
    // Bind color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                           tVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    //Draw 
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
    gl.drawElements(gl.LINES, tIndexEdgeBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}



// Set up the sphere obstacles buffers using sphereFromSubdivision function from MP2simpleModeling
function setupSphereBuffers() 
{
    var sphereSoup=[];
    var sphereNormals=[];
    var sphereColors = [];
    var numT=sphereFromSubdivision(6,sphereSoup,sphereNormals);
    console.log("Generated ", numT, " triangles"); 
    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereSoup), gl.STATIC_DRAW);
    sphereVertexPositionBuffer.itemSize = 3;
    sphereVertexPositionBuffer.numItems = numT*3;
    console.log(sphereSoup.length/9);
    
    // Set sphere colors
    for (i = 0;i < 3*numT*3;i++) {
        sphereColors.push(.9);
    }
    
    // Specify normals to be able to do lighting calculations
    sphereVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereNormals),
                  gl.STATIC_DRAW);
    sphereVertexNormalBuffer.itemSize = 3;
    sphereVertexNormalBuffer.numItems = numT*3;
    
    console.log("Normals ", sphereNormals.length/3);  
    
    //Specify the sphere colors
    sphereVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereColors),
                  gl.STATIC_DRAW);
    sphereVertexColorBuffer.itemSize = 3;
    sphereVertexColorBuffer.numItems = numT*3;

    console.log("Colors ", sphereColors.length/3);  
}



// Draw sphere obstacles
function drawSphere()
{    
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, 
                           gl.FLOAT, false, 0, 0);

    // Bind normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           sphereVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);
 
    // Bind color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                           sphereVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPositionBuffer.numItems);      
}



//-------------------------------------------------------------------------
function uploadModelViewMatrixToShader() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}   

//-------------------------------------------------------------------------
function uploadProjectionMatrixToShader() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
function uploadNormalMatrixToShader() {
    mat3.fromMat4(nMatrix,mvMatrix);
    mat3.transpose(nMatrix,nMatrix);
    mat3.invert(nMatrix,nMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}

//----------------------------------------------------------------------------------
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}



// Quaternion rotation: the rotation by the input angle around the input axis is added to the global rotation quaternion. 
// @param rotAng rotation angle at a frame
// @param rotAxis rotation axis
// @param globalRotation the global rotation quaternion at a frame
function quatrot(rotAng, rotAxis , globalRotation) 
{    
    var quatvector = quat.create();
    quat.setAxisAngle(quatvector, rotAxis, degToRad(rotAng));
    quat.normalize(quatvector,quatvector);
    quat.multiply(globalRotation,quatvector,globalRotation);
    quat.normalize(globalRotation,globalRotation);   
}



// Keyboard Event Handlers
var pressedKey = [];

function handleKeyDown(event) {
    pressedKey[event.keyCode] = true;
}

function handleKeyUp(event) {
    pressedKey[event.keyCode] = false;
}

// Control the eye (or the airplane) by pressing several designated keys
function pressKey() 
{
    // Quaternion Roll
    if (pressedKey[37]) {
        quatrot(-3*rotAngle,viewDir,cameraRotation);                         
    } else if (pressedKey[39]) {
        quatrot(3*rotAngle,viewDir,cameraRotation); } 

    // Quaternion Pitch    
    if (pressedKey[38]) {
        quatrot(rotAngle,viewX,cameraRotation);
    } else if (pressedKey[40]) {
        quatrot(-rotAngle,viewX,cameraRotation); } 

    // Quaternion Yaw
    if (pressedKey[65]) {
        quatrot(rotAngle, up,cameraRotation);
    } else if (pressedKey[68]) {
        quatrot(-rotAngle, up,cameraRotation); } 
    
    // Speed up or go backward
    if (pressedKey[87]) {
        eyeSpeed = eyeSpeed*5;
    } else if (pressedKey[83]) {
        eyeSpeed = eyeSpeed*(-5); } 
    
    // Stop the airplane
    if (pressedKey[32]) {
        eyeSpeed = 0.0; }

    // Normalize the global camera rotation quaternion
    quat.normalize(cameraRotation, cameraRotation);
}



//----------------------------------------------------------------------------------
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
function createGLContext(canvas) {
    var names = ["webgl", "experimental-webgl"];
    var context = null;
    for (var i=0; i < names.length; i++) {
        try {
            context = canvas.getContext(names[i]);
        } catch(e) {}
        if (context) {
        break;
        }
    }
    if (context) {
        context.viewportWidth = canvas.width;
        context.viewportHeight = canvas.height;
    } else {
        alert("Failed to create WebGL context!");
    }
    return context;
}

//----------------------------------------------------------------------------------
function loadShaderFromDOM(id) {
    var shaderScript = document.getElementById(id);
  
    // If we don't find an element with the specified id
    // we do an early exit 
    if (!shaderScript) {
        return null;
    }
  
    // Loop through the children for the found DOM element and
    // build up the shader source code as a string
    var shaderSource = "";
    var currentChild = shaderScript.firstChild;
    while (currentChild) {
        if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
            shaderSource += currentChild.textContent;
        }
        currentChild = currentChild.nextSibling;
    }
 
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
 
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
 
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    } 
    return shader;
}



// Set up the shaders
function setupShaders() 
{
    vertexShader = loadShaderFromDOM("shader-vs");
    fragmentShader = loadShaderFromDOM("shader-fs");
  
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    // Set up the shaders for the vertex colors that will be employed for the terrain and the spheres independently
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
    shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
    shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
    shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
}


//-------------------------------------------------------------------------
function uploadLightsToShader(loc,a,d,s) {
    gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
    gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
    gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
    gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}



// Set up buffers for both the terrain and the sphere obstacles
function setupBuffers() 
{
    setupTerrainBuffers();
    setupSphereBuffers();     
}



// Generate random locations of the sphere obstacles
var sphereRandomLocation1 = vec3.fromValues(Math.random()*2*terrainSize-terrainSize,Math.random()*2*terrainSize-terrainSize,Math.random()*.5*terrainSize+0.25*terrainSize);
var sphereRandomLocation2 = vec3.fromValues(Math.random()*2*terrainSize-terrainSize,Math.random()*2*terrainSize-terrainSize,Math.random()*.5*terrainSize+0.25*terrainSize);
var sphereRandomLocation3 = vec3.fromValues(Math.random()*2*terrainSize-terrainSize,Math.random()*2*terrainSize-terrainSize,Math.random()*.5*terrainSize+0.25*terrainSize);
var sphereRandomLocation4 = vec3.fromValues(Math.random()*2*terrainSize-terrainSize,Math.random()*2*terrainSize-terrainSize,Math.random()*.5*terrainSize+0.25*terrainSize);

// The terrain will be rotated by terrainViewAngle around X axis. 
var terrainViewAngle = -60;

// The spheres will be scaled according to sphereSizeRatio. Here, the ratio values are very close to the spheres' actual sizes. 
var sphereSizeRatio = vec3.fromValues(0.7,0.7,0.7);

// Draw everything.
function draw() 
{ 
    var transformVec = vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(30), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

    // We want to look down -z, so create a lookat point in that direction    
    vec3.transformQuat(viewDir, viewDir, cameraRotation);
    vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);    
    
    // All the other axes with respect to the eye are changed to accommodate the change in the flight axes. 
    vec3.transformQuat(up,up,cameraRotation);
    vec3.transformQuat(viewX,viewX,cameraRotation);
 
    //Draw Terrain
    mvPushMatrix();
    vec3.set(transformVec,0.0,-0.0,-0.0);
    mat4.translate(mvMatrix, mvMatrix,transformVec);
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(terrainViewAngle ));
    mat4.rotateZ(mvMatrix, mvMatrix, degToRad(0));     
    setMatrixUniforms();
    uploadLightsToShader([0,100,100],[0.7,0.7,0.7],[0.4,0.4,0.4],[0.1,0.1,0.1]);
    drawTerrain();
    mvPopMatrix();
  
    // Draw Sphere 1
    mvPushMatrix();
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(terrainViewAngle));
    mat4.translate(mvMatrix, mvMatrix,sphereRandomLocation1);
    mat4.scale(mvMatrix, mvMatrix,sphereSizeRatio);
    uploadLightsToShader([0,100,100],[0.9,0.0,0.0],[0.0,0.9,0.0],[0.0,0.0,0.9]);
    setMatrixUniforms();
    drawSphere();
    mvPopMatrix();
    
    // Draw Sphere 2
    mvPushMatrix();
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(terrainViewAngle));
    mat4.translate(mvMatrix, mvMatrix,sphereRandomLocation2);
    mat4.scale(mvMatrix, mvMatrix,sphereSizeRatio);
    uploadLightsToShader([0,100,100],[0.9,0.0,0.0],[0.0,0.9,0.0],[0.0,0.0,0.9]);
    setMatrixUniforms();
    drawSphere();
    mvPopMatrix();
    
    // Draw Sphere 3
    mvPushMatrix();
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(terrainViewAngle));
    mat4.translate(mvMatrix, mvMatrix,sphereRandomLocation3);
    mat4.scale(mvMatrix, mvMatrix,sphereSizeRatio);
    uploadLightsToShader([0,100,100],[0.9,0.0,0.0],[0.0,0.9,0.0],[0.0,0.0,0.9]);
    setMatrixUniforms();
    drawSphere();
    mvPopMatrix();
    
    // Draw Sphere 4
    mvPushMatrix();
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(terrainViewAngle));
    mat4.translate(mvMatrix, mvMatrix,sphereRandomLocation4);
    mat4.scale(mvMatrix, mvMatrix,sphereSizeRatio);
    uploadLightsToShader([0,100,100],[0.9,0.0,0.0],[0.0,0.9,0.0],[0.0,0.0,0.9]);
    setMatrixUniforms();
    drawSphere();
    mvPopMatrix();
    
    // Calculate the distances between the eye (airplane) and the obstacles.
    var sphereRandomLocation1_shifted = vec3.create();
    vec3.rotateX(sphereRandomLocation1_shifted, sphereRandomLocation1, vec3.fromValues(0,0,0), degToRad(terrainViewAngle));
    distance1 = Math.sqrt(Math.pow(eyePt[0]-sphereRandomLocation1[0],2) + Math.pow(eyePt[1]-sphereRandomLocation1_shifted[1],2) + Math.pow(eyePt[2]-sphereRandomLocation1_shifted[2],2));

    var sphereRandomLocation2_shifted = vec3.create();
    vec3.rotateX(sphereRandomLocation2_shifted, sphereRandomLocation2, vec3.fromValues(0,0,0), degToRad(terrainViewAngle));
    distance2 = Math.sqrt(Math.pow(eyePt[0]-sphereRandomLocation2[0],2) + Math.pow(eyePt[1]-sphereRandomLocation2_shifted[1],2) + Math.pow(eyePt[2]-sphereRandomLocation2_shifted[2],2));

    var sphereRandomLocation3_shifted = vec3.create();
    vec3.rotateX(sphereRandomLocation3_shifted, sphereRandomLocation3, vec3.fromValues(0,0,0), degToRad(terrainViewAngle));
    distance3 = Math.sqrt(Math.pow(eyePt[0]-sphereRandomLocation3[0],2) + Math.pow(eyePt[1]-sphereRandomLocation3_shifted[1],2) + Math.pow(eyePt[2]-sphereRandomLocation3_shifted[2],2));

    var sphereRandomLocation4_shifted = vec3.create();
    vec3.rotateX(sphereRandomLocation4_shifted, sphereRandomLocation4, vec3.fromValues(0,0,0), degToRad(terrainViewAngle));
    distance4 = Math.sqrt(Math.pow(eyePt[0]-sphereRandomLocation4[0],2) + Math.pow(eyePt[1]-sphereRandomLocation4_shifted[1],2) + Math.pow(eyePt[2]-sphereRandomLocation4_shifted[2],2));    
}



// Animate. The calculation is done at every frame.
function animate()
{
    // The location of the eye (airplane) is changed along the view direction, and hence it moves forward by default. 
    eyePt[0] = (1-eyeSpeed)*eyePt[0] + eyeSpeed*(viewPt[0]);
    eyePt[1] = (1-eyeSpeed)*eyePt[1] + eyeSpeed*(viewPt[1]);
    eyePt[2] = (1-eyeSpeed)*eyePt[2] + eyeSpeed*(viewPt[2]);
    
    // Collision detection: go back to the starting location if collision happens. 
    if (distance1 <= sphereSizeRatio[0] || distance2 <= sphereSizeRatio[0] || distance3 <= sphereSizeRatio[0] || distance4 <= sphereSizeRatio[0]) {
        eyePt = [0,0,30];
        viewDir = [0.0,0.0,-1.0];
        up = [0.0,1.0,0.0];
        viewPt = [0.0,0.0,0.0];
        viewX = [1,0,0];
    }
    
    // Initialize the global rotation quaternion and the eye speed. 
    cameraRotation = quat.fromValues(0.0, 0.0, 0.0, 1.0);
    eyeSpeed = 0.05;
}



// Where everything is assembled and run: 
function startup() 
{
    canvas = document.getElementById("myGLCanvas");
    gl = createGLContext(canvas);
    setupShaders();
    setupBuffers();
    gl.clearColor(0.2, 0.5, 0.8, 1.0);
    gl.enable(gl.DEPTH_TEST);
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    tick();
}



// Get frame
function tick()
{
    requestAnimFrame(tick);
    pressKey();
    draw();
    animate();
}

