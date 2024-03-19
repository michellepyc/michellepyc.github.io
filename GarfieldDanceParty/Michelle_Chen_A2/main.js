
var canvas;
var gl;

var program;

var near = 1;
var far = 100;


var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100, 100.0, 200.0, 1.0 );
var lightPosition = vec4(0.0, 100.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var dt = 0.0

var prevTime = 0.0;
var Realtime = 0.0;
var resetTimerFlag = true;
var animFlag = true;
var controller;


// Used for camera animation
var cam_rotate = [0,2,0];

//used for Garf Animation
var limbrotate = [0,0,0,0,0];

// These are used to store the current state of objects.
// In animation it is often useful to think of an object as having some DOF
// Then the animation is simply evolving those DOF over time.
var currentRotation = [0,0,0];
var bouncingCubePosition = [0,40,0];
var bouncyBallVelocity = 0.0;
var bouncyEnergyLoss = 0.30;
var gravity = -4;

//Used for the glasses animation
var glassesPos = [0,17,0];
var glassesV = 0;
var glassesEL = 0.05;
var glassesg = -2;


var blendTextures = 0; //used to pick textures

//speaker animations
var speakerPos = [0]; 
var speakerBoom = [1,1];

// disco floor variables
var texSize = 8;
var imageCheckerBoardData = new Array();

//music note array for animation
var noteFloat = [];

// used to compute fps
var frames = 0.0;
var fps = 0.0;


// Now for each entry of the array make another array
// 2D array now!
for (var i =0; i<texSize; i++){
	imageCheckerBoardData[i] = new Array();
    }
// Now for each entry in the 2D array make a 4 element array (RGBA! for colour)
for (var i =0; i<texSize; i++){
	for ( var j = 0; j < texSize; j++){
		imageCheckerBoardData[i][j] = new Float32Array(4);
        var c = (i + j ) % 2;
		imageCheckerBoardData[i][j] = [c, c, c, 1];

    }
}

//Convert the image to uint8 rather than float.
var imageCheckerboard = new Uint8Array(4*texSize*texSize);

for (var i = 0; i < texSize; i++){
	for (var j = 0; j < texSize; j++){
	   for(var k =0; k<4; k++){
			imageCheckerboard[4*texSize*i+4*j+k] = 255*imageCheckerBoardData[i][j][k];
       }
    }
}
		
// For this example we are going to store a few different textures here
var textureArray = [] ;

// Setting the colour which is needed during illumination of a surface
function setColor(c)
{
	color = c;
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
	gl.uniform4fv( gl.getUniformLocation(program,
        "color"),flatten(color) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition2) );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "shininess"),materialShininess );
}

// We are going to asynchronously load actual image files this will check if that call if an async call is complete
// You can use this for debugging
function isLoaded(im) {
    if (im.complete) {
        console.log("loaded") ;
        return true ;
    }
    else {
        console.log("still not loaded!!!!") ;
        return false ;
    }
}

// Helper function to load an actual file as a texture
// NOTE: The image is going to be loaded asyncronously (lazy) which could be
// after the program continues to the next functions. OUCH!
function loadFileTexture(tex, filename)
{
	//create and initalize a webgl texture object.
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();
    tex.image.src = filename ;
    tex.isTextureReady = false ;
    tex.image.onload = function() { handleTextureLoaded(tex); }
}

// Once the above image file loaded with loadFileTexture is actually loaded,
// this funcion is the onload handler and will be called.
function handleTextureLoaded(textureObj) {
	//Binds a texture to a target. Target is then used in future calls.
		//Targets:
			// TEXTURE_2D           - A two-dimensional texture.
			// TEXTURE_CUBE_MAP     - A cube-mapped texture.
			// TEXTURE_3D           - A three-dimensional texture.
			// TEXTURE_2D_ARRAY     - A two-dimensional array texture.
    gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down
	
	//texImage2D(Target, internalformat, width, height, border, format, type, ImageData source)
    //Internal Format: What type of format is the data in? We are using a vec4 with format [r,g,b,a].
        //Other formats: RGB, LUMINANCE_ALPHA, LUMINANCE, ALPHA
    //Border: Width of image border. Adds padding.
    //Format: Similar to Internal format. But this responds to the texel data, or what kind of data the shader gets.
    //Type: Data type of the texel data
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureObj.image);
	
	//Set texture parameters.
    //texParameteri(GLenum target, GLenum pname, GLint param);
    //pname: Texture parameter to set.
        // TEXTURE_MAG_FILTER : Texture Magnification Filter. What happens when you zoom into the texture
        // TEXTURE_MIN_FILTER : Texture minification filter. What happens when you zoom out of the texture
    //param: What to set it to.
        //For the Mag Filter: gl.LINEAR (default value), gl.NEAREST
        //For the Min Filter: 
            //gl.LINEAR, gl.NEAREST, gl.NEAREST_MIPMAP_NEAREST, gl.LINEAR_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_LINEAR (default value), gl.LINEAR_MIPMAP_LINEAR.
    //Full list at: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
	
	//Generates a set of mipmaps for the texture object.
        /*
            Mipmaps are used to create distance with objects. 
        A higher-resolution mipmap is used for objects that are closer, 
        and a lower-resolution mipmap is used for objects that are farther away. 
        It starts with the resolution of the texture image and halves the resolution 
        until a 1x1 dimension texture image is created.
        */
    gl.generateMipmap(gl.TEXTURE_2D);
	
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);
    console.log(textureObj.image.src) ;
    
    textureObj.isTextureReady = true ;
}

// Takes an array of textures and calls render if the textures are created/loaded
// This is useful if you have a bunch of textures, to ensure that those files are
// actually laoded from disk you can wait and delay the render function call
// Notice how we call this at the end of init instead of just calling requestAnimFrame like before
function waitForTextures(texs) {
    setTimeout(
		function() {
			   var n = 0 ;
               for ( var i = 0 ; i < texs.length ; i++ )
               {
                    console.log(texs[i].image.src) ;
                    n = n+texs[i].isTextureReady ;
               }
               wtime = (new Date()).getTime() ;
               if( n != texs.length )
               {
               		console.log(wtime + " not ready yet") ;
               		waitForTextures(texs) ;
               }
               else
               {
               		console.log("ready to render") ;
					render(0);
               }
		},
	5) ;
}

// This will use an array of existing image data to load and set parameters for a texture
// We'll use this function for procedural textures, since there is no async loading to deal with
function loadImageTexture(tex, image) {
	//create and initalize a webgl texture object.
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();

	//Binds a texture to a target. Target is then used in future calls.
		//Targets:
			// TEXTURE_2D           - A two-dimensional texture.
			// TEXTURE_CUBE_MAP     - A cube-mapped texture.
			// TEXTURE_3D           - A three-dimensional texture.
			// TEXTURE_2D_ARRAY     - A two-dimensional array texture.
    gl.bindTexture(gl.TEXTURE_2D, tex.textureWebGL);

	//texImage2D(Target, internalformat, width, height, border, format, type, ImageData source)
    //Internal Format: What type of format is the data in? We are using a vec4 with format [r,g,b,a].
        //Other formats: RGB, LUMINANCE_ALPHA, LUMINANCE, ALPHA
    //Border: Width of image border. Adds padding.
    //Format: Similar to Internal format. But this responds to the texel data, or what kind of data the shader gets.
    //Type: Data type of the texel data
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
	
	//Generates a set of mipmaps for the texture object.
        /*
            Mipmaps are used to create distance with objects. 
        A higher-resolution mipmap is used for objects that are closer, 
        and a lower-resolution mipmap is used for objects that are farther away. 
        It starts with the resolution of the texture image and halves the resolution 
        until a 1x1 dimension texture image is created.
        */
    gl.generateMipmap(gl.TEXTURE_2D);
	
	//Set texture parameters.
    //texParameteri(GLenum target, GLenum pname, GLint param);
    //pname: Texture parameter to set.
        // TEXTURE_MAG_FILTER : Texture Magnification Filter. What happens when you zoom into the texture
        // TEXTURE_MIN_FILTER : Texture minification filter. What happens when you zoom out of the texture
    //param: What to set it to.
        //For the Mag Filter: gl.LINEAR (default value), gl.NEAREST
        //For the Min Filter: 
            //gl.LINEAR, gl.NEAREST, gl.NEAREST_MIPMAP_NEAREST, gl.LINEAR_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_LINEAR (default value), gl.LINEAR_MIPMAP_LINEAR.
    //Full list at: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);

    tex.isTextureReady = true;
}

// This just calls the appropriate texture loads for this example adn puts the textures in an array
function initTexturesForExample() {
    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"Concrete.jpeg") ;
    
    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"HalfTone3.png") ;

    textureArray.push({}) ;
    loadImageTexture(textureArray[textureArray.length-1], imageCheckerboard) ;
}

// Turn texture use on and off
function toggleTextureOn(a) {
    blendTextures = a
	gl.uniform1i(gl.getUniformLocation(program, "blendTextures"), blendTextures);
}
function toggleTextureOff(a) {
    blendTextures = 0
	gl.uniform1i(gl.getUniformLocation(program, "blendTextures"), blendTextures);
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );

    gl.clearColor(0.3,0.1,0.3,1.0);
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    setColor(materialDiffuse);
	
	// Initialize some shapes, note that the curved ones are procedural which allows you to parameterize how nice they look
	// Those number will correspond to how many sides are used to "estimate" a curved surface. More = smoother
    Cube.init(program);
    Cylinder.init(20,program);
    Cone.init(20,program);
    Sphere.init(36,program);

    // Matrix uniforms
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    // Lighting Uniforms
	gl.uniform4fv( gl.getUniformLocation(program, 
		"ambientProduct"),flatten(ambientProduct) );
	 gl.uniform4fv( gl.getUniformLocation(program, 
		"lightAmbient"),flatten(lightAmbient) );
	 gl.uniform4fv( gl.getUniformLocation(program, 
		"diffuseProduct"),flatten(diffuseProduct) );
	 gl.uniform4fv( gl.getUniformLocation(program, 
		"lightDiffuse"),flatten(lightDiffuse) );
	 gl.uniform4fv( gl.getUniformLocation(program, 
		"specularProduct"),flatten(specularProduct) );	
	 gl.uniform4fv( gl.getUniformLocation(program, 
		"lightPosition"),flatten(lightPosition) );
	 gl.uniform1f( gl.getUniformLocation(program, 
		"shininess"),materialShininess );
	 
	 
	
	// Helper function just for this example to load the set of textures
    initTexturesForExample() ;

    waitForTextures(textureArray);
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix);
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV();   
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCube() {
    setMV();
    Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawSphere() {
    setMV();
    Sphere.draw();
}

function drawShereoid(){
	gPush();
	gScale(1,1.6,1);
	setMV();
	Sphere.draw();
	gPop();
}

// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCylinder() {
    setMV();
    Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCone() {
    setMV();
    Cone.draw();
}

// Draw a Bezier patch
function drawB3(b) {
	setMV() ;
	b.draw() ;
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop();
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix);
}

// Custom Wave Function for sin movements
function aWave(A, w, h, timestamp){
	return A*Math.sin(w*timestamp+h);
}

//garfield's body model
function Body(){
    gPush();
		gPush()
		setColor(vec4(1,0.6,0,1));
		gScale(2.7,3,2)
		drawSphere()
		gPop()
    gPop();
}

// Garfield's Head model
function Head(){
	gPush()
        gTranslate(0,2,0)
		setColor(vec4(1,0.6,0,1))
		gPush()
		gScale(2.6,1.5,2)
		drawShereoid();
		gPop()

		gPush()
		gTranslate(-0.9,1.4,0.4);
		gRotate(5,0,0,1);
		gScale(1.3,2,0.8)
		drawSphere();
		gPop()

		gPush()
		gTranslate(0.9,1.4,0.4);
		gRotate(5,0,0,1);
		gScale(1.3,2,0.8)
		drawSphere();
		gPop()

		gTranslate(0,0,1.6)

		gPush()
		gRotate(10,0,1,1);
		gTranslate(0.5,-1.3,0)
		gScale(0.9,0.6,0.6);
		drawSphere()
		gPop()

		gPush()
		gRotate(-10,0,1,1);
		gTranslate(-0.5,-1.3,0)
		gScale(0.9,0.6,0.6);
		drawSphere()
		gPop()

		gPush()
		gTranslate(-1.4,-0.8,-0.3)
		gRotate(-30,0,0,1);
		gScale(0.6,0.6,0.6);
		drawSphere()
		gPop()

		gPush()
		gTranslate(1.4,-0.8,-0.3)
		gRotate(-30,0,0,1);
		gScale(0.6,0.6,0.6);
		drawSphere()
		gPop()

		gPush()
		setColor(vec4(0.3,0.3,0.3,1))
		gTranslate(0,-1,0.3)
		gScale(0.4,0.26,0.4)
		drawSphere()
		gPop()

		gPush()
		setColor(vec4(1,1,1,1));
		gTranslate(0.5,0,0)
		gScale(1,1.2,0.5)
		drawSphere();
			gPush()
				gTranslate(0,0,0.6);
				gScale(0.5,0.6,0.5)
					setColor(vec4(0.3,0.3,0.3,1))
				drawSphere();
			gPop()
		gPop()

		gPush()
		setColor(vec4(1,0.6,0,1))

		gTranslate(0.6,0.3,0.08)
		gScale(1.8,1.3,1)
		gRotate(-35,1,0,-0.3)
		gPush()
			gRotate(90,1,0,0)
			gScale(1,1,0.5)
			drawCylinder()
		gPop()

		gTranslate(0,0.3,0)
		gScale(0.5,0.5,0.5)
		drawSphere()
		gPop()

		gPush()
		setColor(vec4(1,0.6,0,1))

		gTranslate(-0.6,0.3,0.08)
		gScale(1.8,1.3,1)
		gRotate(-35,1,0,0.3)
		gPush()
			gRotate(90,1,0,0)
			gScale(1,1,0.5)
			drawCylinder()
		gPop()

		gTranslate(0,0.3,0)
		gScale(0.5,0.5,0.5)
		drawSphere()
		gPop()

		

		gPush()
		setColor(vec4(1,1,1,1));
		gTranslate(-0.5,0,0)
		gScale(1,1.2,0.5)
		drawSphere();
			gPush()
				gTranslate(0,0,0.6);
				gScale(0.5,0.6,0.5)
					setColor(vec4(0.3,0.3,0.3,1))
				drawSphere();
			gPop()
		gPop()


	gPop()
}

// Custom function used to create limbs of any length a
function limb(a){
    gPush()
    //gTranslate(4,-2,0);
    drawSphere();
        gPush()
        gTranslate(0,-a/2,0);
        gRotate(90,1,0,0)
        gScale(2,2,a)
        drawCylinder();
        gPop()
    gTranslate(0,-a,0);
    drawSphere();
    gPop()
}

// Arm, leg and tail models
function arm_left(){
    gPush()
        setColor(vec4(1,0.6,0,1))
        
            gPush()
            gScale(0.6,0.6,0.6)
            limb(5);
            gPop()
        gTranslate(0,-3.5,0)
            gPush()
            gScale(1,1.3,1)
            drawSphere();
            gPop()
        gTranslate(0,-0.9,0)
        gScale(0.7,1,0.7)
            gTranslate(0.4,0,-0.3)
            drawSphere()
            gTranslate(-0.8,0.1,-0.1)
            drawSphere()
            gTranslate(-0.3,0.1,-0.1)
            drawSphere()

    gPop()


}
function arm_right(){
    gPush()
        setColor(vec4(1,0.6,0,1))

            gPush()
            gScale(0.6,0.6,0.6)
            limb(5);
            gPop()
        gTranslate(0,-3.5,0)
            gPush()
            gScale(1,1.3,1)
            drawSphere();
            gPop()
        gTranslate(0,-0.9,0)
        gScale(0.7,1,0.7)
            gTranslate(0.4,0,-0.3)
            drawSphere()
            gTranslate(-0.8,0.1,-0.1)
            drawSphere()
            gTranslate(-0.3,0.1,-0.1)
            drawSphere()

    gPop()
}
function leg_right(){
    gPush()
        setColor(vec4(1,0.6,0,1))
        gPush()
            gPush()
            gScale(0.8,0.8,0.8)
            limb(5)
            gPop()
            gTranslate(0.6,-4.5,1)
                gRotate(30,0.4,1,0);
                gPush()
                gScale(1,1,2)
                drawSphere()
                gPop()

            gTranslate(0,0.2,1)
            gPush()
            gTranslate(0.5,-0.2,0.2)
            gScale(0.8,0.8,0.8)
            drawSphere()
            gPop()
            gPush()
            gTranslate(0,-0.1,0.2)
            gScale(0.9,0.9,0.9)
            drawSphere()
            gPop()
            gPush()
            gTranslate(-1,0,0)
            drawSphere()
            gPop()
        gPop()

    gPop()
}
function leg_left(){
    gPush()
        setColor(vec4(1,0.6,0,1))
        gPush()
            gPush()
            gScale(0.8,0.8,0.8)
            limb(5)
            gPop()
            gTranslate(-0.6,-4.5,1)
                gRotate(30,0.4,-1,0);
                gPush()
                gScale(1,1,2)
                drawSphere()
                gPop()

            gTranslate(0,0.2,1)
            gPush()
            gTranslate(-0.5,-0.2,0.2)
            gScale(0.8,0.8,0.8)
            drawSphere()
            gPop()
            gPush()
            gTranslate(0,-0.1,0.2)
            gScale(0.9,0.9,0.9)
            drawSphere()
            gPop()
            gPush()
            gTranslate(1,0,0)
            drawSphere()
            gPop()
        gPop()

    gPop()
}
function tail(){
    gPush()
        setColor(vec4(1,0.6,0,1))
        gRotate(-45,1,0,0);
        gTranslate(0,1,0)
            gPush()
            gScale(0.8,0.8,0.8);
            limb(2);
            gPop()
        gTranslate(0,0,0);
            gRotate(180,1,0,0)
            gRotate(30,1,0,0)
            gScale(0.8,0.8,0.8);
            limb(6)
    gPop()
}

//glasses physics
function glasses(){
    gPush();
        setColor(vec4(0.1,0.1,0.2,1)); 
        gScale(1.7,0.14,0.1);
        drawCube();	

        gPush();
        gTranslate(0.5,-2,0);
        gScale(0.4,1,1);
        drawCube();
        gPop();

        gPush();
        gTranslate(0.5,-4,0);
        gScale(0.3,1,1);
        drawCube();
        gPop();

        gPush();
        gTranslate(0.5,-5,0);
        gScale(0.2,1,1);
        drawCube();
        gPop();

        gPush(); 
        setColor(vec4(1,1,1,1)); 
        gTranslate(0.56,-4,0.3);
            gPush();
                gScale(0.08,1,1);
                drawCube();
            gPop();
        gTranslate(0.13,2,0.3);
            gPush();
                gScale(0.08,1,1);
                drawCube();
            gPop();
        gPop();

        setColor(vec4(0.1,0.1,0.2,1)); 

        gPush();
        gTranslate(-0.5,-2,0);
        gScale(0.4,1,1);
        drawCube();
        gPop();

        gPush();
        gTranslate(-0.5,-4,0);
        gScale(0.3,1,1);
        drawCube();
        gPop();

        gPush();
        gTranslate(-0.5,-5,0);
        gScale(0.2,1,1);
        drawCube();
        gPop();

        gPush(); 
        setColor(vec4(1,1,1,1)); 
        gTranslate(-0.44,-4,0.3);
            gPush();
            gScale(0.08,1,1);
            drawCube();
            gPop();
        gTranslate(0.13,2,0.3);
            gPush();
            gScale(0.08,1,1);
            drawCube();
            gPop();
        gPop();
    gPop();
    }

//modeling garfield using function models
function Garf(){
    gPush();
        Body();
        gPush();
            gTranslate(0,2.3,0)
            gRotate(limbrotate[0],1,0,0); //headbobbing
            gRotate(limbrotate[1],0,1,0);
            gPush();
            {	
                //Note simplified velocity and acceleration ehre are just scalars, normally they are vectors in 3D
                glassesV += glassesg*dt; // Update velocity using acceleration
                glassesPos[1] += glassesV*dt; // Update position using velocity
                // Check if ball hits an imaginary plane at y = 0, and also if the velocity is INTO the plane, and if it is moving at all
                if (glassesPos[1] < 0 && glassesV < 0)
                {
                    glassesV = -glassesEL*glassesV; // If so, reflect the velocity back but lose some energy.
                    glassesPos[1] = 0; // Ball has most likely penetrated surface because we take discrete time steps, move back to cylinder surface
                }
                gTranslate(0,2,0);
                gTranslate(glassesPos[0],glassesPos[1],glassesPos[2]+2); // Move the ball to its update position
                setColor(vec4(0.1,0.1,0.2,1)); 
                gPush();
                gTranslate(0,0,0.3);
                glasses();
                gPop();
        
            }
            gPop();
            Head();
        gPop();

        gPush();
            gTranslate(2,1,0.5); 
            gRotate(20,0,0,1)
            gRotate(-90,0,1,0)
            gRotate(limbrotate[2],1,0,0);
            gRotate(limbrotate[2]*2,0,1,0);

            arm_left();
        gPop();

        gPush();
            gTranslate(-2,1,0.5);
            gRotate(-20,0,0,1)
            gRotate(90,0,1,0)
            gRotate(limbrotate[2],1,0,0);
            gRotate(-limbrotate[2]*2,0,1,0);
            arm_right();
        gPop();

        gPush();
            gTranslate(1,-2.5,0)
            leg_right();
        gPop();

        gPush();
            gTranslate(-1,-2.5,0)
            leg_left();
        gPop();
	    
        gPush();
            gTranslate(0,0,-2);
            gRotate(limbrotate[4],0,0,1);
            tail();
        gPop();
    gPop();
}

// Call to start headbobing movement
function headBob(){
    limbrotate[0] = aWave(10, 0.009, 0, prevTime);
    limbrotate[1] = aWave(10, 0.001, 0, prevTime);
}

// Speaker model with variable 'a' used to scale
function speaker(a){

gPush();
    gScale(2,2,2);
    gScale(a,a,a);
    setColor(vec4(0.15,0.15,0.25,1))
    gTranslate(0,5,0)
    gPush();
        gScale(2.3,5,1.5);
        drawCube();
    gPop();

    gTranslate(0,0,1);

        gPush();
        setColor(vec4(0.1,0.1,0.1,1))
        gTranslate(0,2,0);
        gScale(1.5*speakerBoom[0],1.5*speakerBoom[0],speakerBoom[0]);
        drawCube();
        setColor(vec4(0.2,0.2,0.3,1))
        gTranslate(0,0,0.3)
        gScale(speakerBoom[1],speakerBoom[1],speakerBoom[1]);
        drawSphere();
        gPop();

        gPush();
        setColor(vec4(0.1,0.1,0.1,1))
        gTranslate(0,-2,0);
        gScale(1.5*speakerBoom[0],1.5*speakerBoom[0],speakerBoom[0]);
        drawCube();
        setColor(vec4(0.2,0.2,0.3,1))
        gTranslate(0,0,0.3)
        gScale(speakerBoom[1],speakerBoom[1],speakerBoom[1]);
        drawSphere();
        gPop();

gPop();
}

// Speaker drop physics from lab7 modified
function dropSpeaker(a){
	gPush();
	{	
		//Note simplified velocity and acceleration ehre are just scalars, normally they are vectors in 3D
		bouncyBallVelocity += gravity*dt; // Update velocity using acceleration
		bouncingCubePosition[1] += bouncyBallVelocity*dt*a; // Update position using velocity
		// Check if ball hits an imaginary plane at y = 0, and also if the velocity is INTO the plane, and if it is moving at all
		if (bouncingCubePosition[1] < 0 && bouncyBallVelocity < 0)
		{
			bouncyBallVelocity = -bouncyEnergyLoss*bouncyBallVelocity; // If so, reflect the velocity back but lose some energy.
			bouncingCubePosition[1] = 0; // Ball has most likely penetrated surface because we take discrete time steps, move back to cylinder surface
        }
        gTranslate(0,-11,0);
		gTranslate(bouncingCubePosition[0],bouncingCubePosition[1],bouncingCubePosition[2]); // Move the ball to its update position
        gTranslate(0,3,0);
        speaker(a);
	}
	gPop();
}

// Music note models
function note1(){
    gPush();
                gPush();
                gScale(1.4,0.3,0.3);
                drawCube();
                gPop();
           gTranslate(1.2,-1.3,0);
                gPush(); 
                gScale(0.3,1.5,0.3);
                drawCube();
                gPop();
                gPush();
                gTranslate(-0.5,-1.5,0);
                gScale(0.7,0.7,0.7);
                drawSphere();
                gPop();
            gTranslate(-2.3,0,0);
                gPush(); 
                gScale(0.3,1.5,0.3);
                drawCube();
                gPop();
                gPush();
                gTranslate(-0.5,-1.5,0);
                gScale(0.7,0.7,0.7);
                drawSphere();
                gPop(); 
        toggleTextureOff();
    gPop();
}
function note2(){
    gPush();
                gPush();
                gScale(1,0.3,0.3);
                drawCube();
                gPop();
           gTranslate(-0.7,-1.3,0);
                gPush(); 
                gScale(0.3,1.5,0.3);
                drawCube();
                gPop();
                gPush();
                gTranslate(-0.5,-1.5,0);
                gScale(0.7,0.7,0.7);
                drawSphere();
                gPop();
        toggleTextureOff();
    gPop();
}

// Spawn 35 notes of differnt values
function spawnNote2(r,g,b){
    for(var i = 0; i < 35; i++) 
    {
        gPush();
        {  
            noteFloat.push(0);
            gRotate((15*i),0,1,0)
            noteFloat[i] = noteFloat[i] + (i%5)*dt;
            gTranslate(1*(i%3), 3*noteFloat[i]-(i%10), ((i^6)%3)*noteFloat[i]);
            setColor(vec4(i * r, i * g, i * b, 1.0));
            gPush();
            gRotate(20*i,0,1,0);
            note2();
            gPop();
        }
        gPop();
        
        if (noteFloat[i] > 40){
            noteFloat[i] = 0;
        }

    }
}
function spawnNote1(r,g,b){
    for(var i = 0; i < 35; i++) 
    {
        gPush();
        {  
            noteFloat.push(0);
            gRotate((15*i),0,1,0)
            noteFloat[i] = noteFloat[i] + (i%2)*dt;
            gTranslate(1*(i%3), 3*noteFloat[i] - (i%10), ((i^6)%2)*noteFloat[i]);
            setColor(vec4(i * r, i * g, i * b, 1.0));
            gPush();
            gRotate(20*i,0,1,0);
            note1();
            gPop();
        }
        gPop();
        
        if (noteFloat[i] > i){
            noteFloat[i] = 0;
        }

    }
}


function render(timestamp) {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Camera Movements 

	if(timestamp/1000 < 4.05){              //Zoom in
        cam_rotate[2]= 10 - timestamp/1000;
    }

    if(timestamp/1000 > 5 && timestamp/1000 < 8.05){    //Move cam down while looking up & wait for speaker drop
        cam_rotate[1] = 8-timestamp/800;
    }

    if(timestamp/1000 > 11.06 && timestamp/1000 < 12.05){ // Pan camera back up 
        cam_rotate[1] = -13 + timestamp/1000;
    }

    
    if(timestamp/1000 > 12.6 && timestamp/1000 <25.1){  // 360 camera rotations
        cam_rotate[0] = 5.9 * Math.sin(timestamp/1000);
        cam_rotate[2] = 5.9 * Math.cos(timestamp/1000);
    }
    
   
	eye = vec3(cam_rotate[0],cam_rotate[1],cam_rotate[2]);
    
	MS = []; // Initialize modeling matrix stack
	
	// initialize the modeling matrix to identity
    modelMatrix = mat4();
    
    // set the camera matrix
    viewMatrix = lookAt(eye, at, up);
   
    // set the projection matrix
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
	projectionMatrix = perspective( 90.0, 1, 1, 30 );
    
    // set all the matrices
    setAllMatrices();
	
    
	if( animFlag )
    {
		// dt is the change in time or delta time from the last frame to this one
		// in animation typically we have some property or degree of freedom we want to evolve over time
		// For example imagine x is the position of a thing.
		// To get the new position of a thing we do something called integration
		// the simpelst form of this looks like:
		// x_new = x + v*dt
		// That is the new position equals the current position + the rate of of change of that position (often a velocity or speed), times the change in time
		// We can do this with angles or positions, the whole x,y,z position or just one dimension. It is up to us!
		dt = (timestamp - prevTime) / 1000.0;
		prevTime = timestamp;
	}


    //pass time variables into html to sync with shaders
    gl.uniform1f( gl.getUniformLocation(program, 
		"Timer2"),prevTime/1000);
    gl.uniform1f( gl.getUniformLocation(program, 
		"Timer3"), prevTime/100);
    Realtime  = Realtime + dt;
    gl.uniform1f( gl.getUniformLocation(program, 
		"Timer"),Realtime );

	// We need to bind our textures, ensure the right one is active before we draw
	//Activate a specified "texture unit".
    //Texture units are of form gl.TEXTUREi | where i is an integer.
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
	gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
	
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
	gl.uniform1i(gl.getUniformLocation(program, "texture2"), 1);

	gl.activeTexture(gl.TEXTURE3);
	gl.bindTexture(gl.TEXTURE_2D, textureArray[2].textureWebGL);
	gl.uniform1i(gl.getUniformLocation(program, "checkered"), 3);
	
    // Starting Animation
    limbrotate[4] = aWave(40, 0.001, 0, prevTime);
    speakerBoom[0] = 1 + aWave(0.05, 0.01, 0, prevTime);
    speakerBoom[1] = 1 + aWave(0.05, 0.1, 1, prevTime);
    
    // draw a room
    if(Realtime >0 && Realtime < 9.5){
        gPush();
            gTranslate(0,0,6);
            toggleTextureOn(1); //texture
            setColor(vec4(0.5,0.5,0.5));
            gScale(9,10,14)
            drawCube();
            toggleTextureOff();
        gPop();
        }

    // after speakers drop apply lighting texture
    if(Realtime >9.5){
        gPush();
            toggleTextureOn(6); //lights on
            gTranslate(0,0,0);
            gScale(9,10,14)
            drawCube();
            toggleTextureOff();
        gPop();
        }

    // Draw empty disco floor
    if(Realtime <= 9.5){
	gPush();
    {
        gTranslate(0,-6,0);
        gScale(10,1,10);
        toggleTextureOn(3); //texture
        drawCube();
        toggleTextureOff();
    }
    gPop();
    }

    // After drop turn on disco lights
    if(Realtime >= 9.5){
	gPush();
    {
        gTranslate(0,-6,0);
        gScale(10,1,10)
        toggleTextureOn(4); //disco lights
        drawCube();
        toggleTextureOff();
    }
    gPop();
    }

	//scale down to fit into screen
    gTranslate(0,-1,0);
	gScale(0.5,0.5,0.5);

    //Before Speakers drop, lift arms up
    if(Realtime > 6 && Realtime <8){
        limbrotate[2] = aWave(-90,0.6,-0.4,Realtime);
    }
    //Droping Speakers
    if (Realtime >= 7 && Realtime < 9.5){ 
        gPush();
        toggleTextureOn(7); //used cartoon texture
        gTranslate(0,0,3)
        {
        gPush();
            gRotate(50,0,1,0);
            gTranslate(0,0,-20);
            dropSpeaker(1);
        gPop();
        gPush();
            gRotate(-50,0,1,0);
            gTranslate(0,0,-20);
            dropSpeaker(1);
        gPop();

        gPush();
            gTranslate(0,0,-20);
            dropSpeaker(1.5);
        gPop();
        }
        toggleTextureOff();
        gPop();
    }

    //After speaker drop turn on lights
    if (Realtime > 9.5){ 
        gPush();
        gTranslate(0,-8,3)
        {
        toggleTextureOn(5); //turn on lights
        gPush();
            gRotate(50,0,1,0);
            gTranslate(0,0,-20);
            speaker(1);
        gPop();

        gPush();
            gRotate(-50,0,1,0);
            gTranslate(0,0,-20);
            speaker(1);
        gPop();

        gPush();
            gTranslate(0,0,-20);
            speaker(1.5);
        gPop();
        }
        toggleTextureOff();
        gPop();
    }

    //begin head bobbing and music note animations
    if (Realtime >= 9.5){
        headBob();
        gPush();

            gPush();
            gTranslate(0,-7,-17);
        
            gPush();
            spawnNote2(0.9,0.02,0.09);
            gPop();
        
            gPush();
            gTranslate(2,-1,0);
            gRotate(40,0,1,0);
            spawnNote1(0.02,0.5,0.2);
            gPop();

            gPush();
            gTranslate(-2,-1,0);
            gRotate(30,0,1,0);
            spawnNote1(0.04,0.02,0.1,);
            gPop();

            gPush();
            gTranslate(0,-1,0);
            gRotate(40,0,1,0);
            spawnNote2(0.1,0.9,0.03);
            gPop();
            gPop();
       
        
        gPop();
    }

    //move arms back down
    if(Realtime > 9 && Realtime <12.2){
        limbrotate[2] = aWave(-90,0.6,-0.4,Realtime-1.0);
    }
    
    // regular garfield with ads lighting
    if(Realtime < 9.5){
        Garf();
    }

    //garfield with banded lighted 
    if(Realtime > 9.5){
        toggleTextureOn(7); //cartoon effect
        Garf();
        glassesPos = [0,0,0];
        toggleTextureOff();
    }

    // Calculate fps
    if( animFlag )

        //update every 2 seconds
        window.requestAnimFrame(render);
}
