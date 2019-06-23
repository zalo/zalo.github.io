(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('./index')(THREE)
},{"./index":2}],2:[function(require,module,exports){
/**************************
 * Dusan Bosnjak @pailhead
 **************************/
 
module.exports = function( THREE ){

const differentSignature = parseInt(THREE.REVISION) >= 96

//monkeypatch shaders
require('./monkey-patch.js')(THREE);


//depth mat
var DEPTH_MATERIAL = new THREE.MeshDepthMaterial();

DEPTH_MATERIAL.depthPacking = THREE.RGBADepthPacking;

DEPTH_MATERIAL.clipping = true;

DEPTH_MATERIAL.defines = {

	INSTANCE_TRANSFORM: ''

};

//distance mat
var 
	
	DISTANCE_SHADER = THREE.ShaderLib[ "distanceRGBA" ],
	DISTANCE_UNIFORMS = THREE.UniformsUtils.clone( DISTANCE_SHADER.uniforms ),
	DISTANCE_DEFINES = {
		'USE_SHADOWMAP': '',
		'INSTANCE_TRANSFORM': ''
	},
	DISTANCE_MATERIAL = new THREE.ShaderMaterial( {
		defines: DISTANCE_DEFINES,
		uniforms: DISTANCE_UNIFORMS,
		vertexShader: DISTANCE_SHADER.vertexShader,
		fragmentShader: DISTANCE_SHADER.fragmentShader,
		clipping: true
	})
;

//main class
THREE.InstancedMesh = function ( 
	bufferGeometry, 
	material, 
	numInstances, 
	dynamic, 
	colors, 
	uniformScale 
) {

	THREE.Mesh.call( this , (new THREE.InstancedBufferGeometry()).copy( bufferGeometry ) ); //hacky for now

	this._dynamic = !!dynamic; //TODO: set a bit mask for different attributes?

 	this._uniformScale = !!uniformScale;

 	this._colors = !!colors;

	this.numInstances = numInstances;

	this._setAttributes();

	/**
	 * use the setter to decorate this material
	 * this is in lieu of changing the renderer
	 * WebGLRenderer injects stuff like this
	 */
	this.material = material.clone();
 	
	this.frustumCulled = false; //you can uncheck this if you generate your own bounding info

	//make it work with depth effects
	this.customDepthMaterial = DEPTH_MATERIAL; 

	this.customDistanceMaterial = DISTANCE_MATERIAL;

}

THREE.InstancedMesh.prototype = Object.create( THREE.Mesh.prototype );

THREE.InstancedMesh.constructor = THREE.InstancedMesh;

//this is kinda gnarly, done in order to avoid setting these defines in the WebGLRenderer (it manages most if not all of the define flags)
Object.defineProperties( THREE.InstancedMesh.prototype , {

	'material': {

		set: function( m ){ 

			/**
			 * whenever a material is set, decorate it, 
			 * if a material used with regular geometry is passed, 
			 * it will mutate it which is bad mkay
			 *
			 * either flag Material with these instance properties:
			 * 
			 *  "i want to create a RED PLASTIC material that will
			 *   be INSTANCED and i know it will be used on clones
			 *   that are known to be UNIFORMly scaled"
			 *  (also figure out where dynamic fits here)
			 *  
			 * or check here if the material has INSTANCE_TRANSFORM
			 * define set, if not, clone, document that it breaks reference
			 * or do a shallow copy or something
			 * 
			 * or something else?
			 */
			m = m.clone();

			if ( m.defines ) {
				
				m.defines.INSTANCE_TRANSFORM = '';
				
				if ( this._uniformScale ) m.defines.INSTANCE_UNIFORM = ''; //an optimization, should avoid doing an expensive matrix inverse in the shader
				else delete m.defines['INSTANCE_UNIFORM'];

				if ( this._colors ) m.defines.INSTANCE_COLOR = '';
				else delete m.defines['INSTANCE_COLOR'];
			}

			else{ 
			
				m.defines = { INSTANCE_TRANSFORM: '' };

				if ( this._uniformScale ) m.defines.INSTANCE_UNIFORM = '';
				if ( this._colors ) m.defines.INSTANCE_COLOR = '';
			}

			this._material = m;

		},

		get: function(){ return this._material; }

	},

	//force new attributes to be created when set?
	'numInstances': {

		set: function( v ){ 

			this._numInstances = v;

			//reset buffers

			this._setAttributes();

		},

		get: function(){ return this._numInstances; }

	},

	//do some auto-magic when BufferGeometry is set
	//TODO: account for Geometry, or change this approach completely 
	'geometry':{

		set: function( g ){ 

			//if its not already instanced attach buffers
			if ( !!g.attributes.instancePosition ) {

				this._geometry = new THREE.InstancedBufferGeometry();

				this._setAttributes();

			} 

			else 

				this._geometry = g;

		},

		get: function(){ return this._geometry; }

	}

});

THREE.InstancedMesh.prototype.setPositionAt = function( index , position ){

	this.geometry.attributes.instancePosition.setXYZ( index , position.x , position.y , position.z );

};

THREE.InstancedMesh.prototype.setQuaternionAt = function ( index , quat ) {

	this.geometry.attributes.instanceQuaternion.setXYZW( index , quat.x , quat.y , quat.z , quat.w );

};

THREE.InstancedMesh.prototype.setScaleAt = function ( index , scale ) {

	this.geometry.attributes.instanceScale.setXYZ( index , scale.x , scale.y , scale.z );

};

THREE.InstancedMesh.prototype.setColorAt = function ( index , color ) {

	if( !this._colors ) {

		console.warn( 'THREE.InstancedMesh: color not enabled');

		return;

	}

	this.geometry.attributes.instanceColor.setXYZ( 
		index , 
		Math.floor( color.r * 255 ), 
		Math.floor( color.g * 255 ), 
		Math.floor( color.b * 255 )
	);

};

THREE.InstancedMesh.prototype.getPositionAt = function( index , position ){

	var arr = this.geometry.attributes.instancePosition.array;

	index *= 3;

	return position ? 

		position.set( arr[index++], arr[index++], arr[index] ) :

		new THREE.Vector3(  arr[index++], arr[index++], arr[index] )
	;
	
};

THREE.InstancedMesh.prototype.getQuaternionAt = function ( index , quat ) {

	var arr = this.geometry.attributes.instanceQuaternion.array;

	index = index << 2;

	return quat ? 

		quat.set(       arr[index++], arr[index++], arr[index++], arr[index] ) :

		new THREE.Quaternion( arr[index++], arr[index++], arr[index++], arr[index] )
	;
	
};

THREE.InstancedMesh.prototype.getScaleAt = function ( index , scale ) {

	var arr = this.geometry.attributes.instanceScale.array;

	index *= 3;

	return scale ? 

		scale.set(   arr[index++], arr[index++], arr[index] ) :

		new THREE.Vector3( arr[index++], arr[index++], arr[index] )
	;

};

THREE.InstancedMesh.prototype.getColorAt = (function(){

	var inv255 = 1/255;

	return function ( index , color ) {

		if( !this._colors ) {

			console.warn( 'THREE.InstancedMesh: color not enabled');

			return false;

		}

		var arr = this.geometry.attributes.instanceColor.array;
		
		index *= 3;

		return color ? 

			color.setRGB( arr[index++] * inv255, arr[index++] * inv255, arr[index] * inv255 ) :

			new THREE.Vector3( arr[index++], arr[index++], arr[index] ).multiplyScalar( inv255 )
		;

	};

})()

THREE.InstancedMesh.prototype.needsUpdate = function( attribute ){

	switch ( attribute ){

		case 'position' :

			this.geometry.attributes.instancePosition.needsUpdate =   true;

			break;

		case 'quaternion' :

			this.geometry.attributes.instanceQuaternion.needsUpdate = true;

			break;

		case 'scale' :

			this.geometry.attributes.instanceScale.needsUpdate =      true;

			break;

		case 'colors' :

			this.geometry.attributes.instanceColor.needsUpdate =      true;

		default:

			this.geometry.attributes.instancePosition.needsUpdate =   true;
			this.geometry.attributes.instanceQuaternion.needsUpdate = true;
			this.geometry.attributes.instanceScale.needsUpdate =      true;
		
			if(this._colors){
				this.geometry.attributes.instanceColor.needsUpdate =      true;
			}

			break;

	}

};

THREE.InstancedMesh.prototype._setAttributes = function(){

	var normalized = true
	var meshPerAttribute = 1 
	var vec4Size = 4
	var vec3Size = 3

	var attributes = {
		instancePosition: [
			new Float32Array( this.numInstances * vec3Size ), 
			vec3Size, 
			!normalized, 
			meshPerAttribute,
		],
		instanceQuaternion: [
			new Float32Array( this.numInstances * vec4Size ), 
			vec4Size, 
			!normalized, 
			meshPerAttribute,
		],
		instanceScale: [
			new Float32Array( this.numInstances * vec3Size ), 
			vec3Size, 
			!normalized,
			meshPerAttribute,
		]
	}

	if ( this._colors ){
		attributes.instanceColor = [
			new Uint8Array( this.numInstances * vec3Size ), 
			vec3Size, 
			normalized, 
			meshPerAttribute,
		]
		console.log(attributes)
	}

	Object.keys(attributes).forEach(name=>{
		const a = attributes[name]
		let attribute
		if(differentSignature){
			attribute = new THREE.InstancedBufferAttribute(...a)
		} else {
			attribute = new THREE.InstancedBufferAttribute(a[0],a[1],a[3])
			attribute.normalized = a[2]
		}
			
		attribute.dynamic = this._dynamic
		this.geometry.addAttribute(name, attribute)
	})

};

return THREE.InstancedMesh;

};

},{"./monkey-patch.js":3}],3:[function(require,module,exports){
/**************************
 * Dusan Bosnjak @pailhead
 **************************/

module.exports = function ( THREE ){
	
	if( /InstancedMesh/.test( THREE.REVISION ) ) return THREE;

	require('./monkey-patch/index.js')( THREE );

	THREE.REVISION += "_InstancedMesh";

	return THREE;

}
},{"./monkey-patch/index.js":9}],4:[function(require,module,exports){
/**************************
 * Dusan Bosnjak @pailhead
 **************************/

// transform vertices with the transform matrix

module.exports = [

"#ifndef INSTANCE_TRANSFORM",

"vec3 transformed = vec3( position );",

"#else",

"#ifndef INSTANCE_MATRIX",

	"mat4 _instanceMatrix = getInstanceMatrix();",

	"#define INSTANCE_MATRIX",

"#endif",

"vec3 transformed = ( _instanceMatrix * vec4( position , 1. )).xyz;",

"#endif",

].join("\n")
},{}],5:[function(require,module,exports){
/**************************
 * Dusan Bosnjak @pailhead
 **************************/

// multiply the color with per instance color if enabled

module.exports = [

'#ifdef USE_COLOR',

	'diffuseColor.rgb *= vColor;',

'#endif',

'#if defined(INSTANCE_COLOR)',
		
	'diffuseColor.rgb *= vInstanceColor;',
		
'#endif'

].join("\n")
},{}],6:[function(require,module,exports){
/**************************
 * Dusan Bosnjak @pailhead
 **************************/

// add fragment varying if feature enabled

module.exports = [

"#ifdef USE_COLOR",

	"varying vec3 vColor;",

"#endif",

"#if defined( INSTANCE_COLOR )",
		
	"varying vec3 vInstanceColor;",
		
"#endif"

].join("\n")
},{}],7:[function(require,module,exports){
/**************************
 * Dusan Bosnjak @pailhead
 **************************/

// read per instance color from attribute, pass to varying

module.exports = [

"#ifdef USE_COLOR",

	"vColor.xyz = color.xyz;",

"#endif",

"#if defined( INSTANCE_COLOR ) && defined( INSTANCE_TRANSFORM )",
		
	"vInstanceColor = instanceColor;",
		
"#endif",

].join("\n")
},{}],8:[function(require,module,exports){
/**************************
 * Dusan Bosnjak @pailhead
 **************************/

module.exports = [

"#ifdef FLIP_SIDED",

	"objectNormal = -objectNormal;",

"#endif",

"#ifndef INSTANCE_TRANSFORM",

	"vec3 transformedNormal = normalMatrix * objectNormal;",

"#else",

	"#ifndef INSTANCE_MATRIX ",

		"mat4 _instanceMatrix = getInstanceMatrix();",

		"#define INSTANCE_MATRIX",

	"#endif",

	"#ifndef INSTANCE_UNIFORM",
	
		"vec3 transformedNormal =  transposeMat3( inverse( mat3( modelViewMatrix * _instanceMatrix ) ) ) * objectNormal ;",

	"#else",

		"vec3 transformedNormal = ( modelViewMatrix * _instanceMatrix * vec4( objectNormal , 0.0 ) ).xyz;",

	"#endif",

"#endif"

].join("\n");
},{}],9:[function(require,module,exports){
/**************************
 * Dusan Bosnjak @pailhead
 **************************/

module.exports = function( THREE ){

	//patches these methods and shader chunks with the required logic 
	THREE.ShaderChunk[ 'begin_vertex' ] = 				require('./begin_vertex.glsl.js'); 
	THREE.ShaderChunk[ 'color_fragment' ] = 			require('./color_fragment.glsl.js');
	THREE.ShaderChunk[ 'color_pars_fragment' ] = 		require('./color_pars_fragment.glsl.js');
	THREE.ShaderChunk[ 'color_vertex' ] = 				require('./color_vertex.glsl.js');
	THREE.ShaderChunk[ 'defaultnormal_vertex' ] = 		require('./defaultnormal_vertex.glsl.js');
	THREE.ShaderChunk[ 'uv_pars_vertex' ] = 			require('./uv_pars_vertex.glsl.js');
	
}
},{"./begin_vertex.glsl.js":4,"./color_fragment.glsl.js":5,"./color_pars_fragment.glsl.js":6,"./color_vertex.glsl.js":7,"./defaultnormal_vertex.glsl.js":8,"./uv_pars_vertex.glsl.js":10}],10:[function(require,module,exports){
/**************************
 * Dusan Bosnjak @pailhead
 **************************/

module.exports = [

"#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )",
 
  "varying vec2 vUv;",
  
  "uniform mat3 uvTransform;",

"#endif",

"#ifdef INSTANCE_TRANSFORM",

"mat3 inverse(mat3 m) {",

  "float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];",

  "float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];",

  "float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];",

  "float b01 = a22 * a11 - a12 * a21;",

  "float b11 = -a22 * a10 + a12 * a20;",

  "float b21 = a21 * a10 - a11 * a20;",

  "float det = a00 * b01 + a01 * b11 + a02 * b21;",

  "return mat3(b01, (-a22 * a01 + a02 * a21), ( a12 * a01 - a02 * a11),",
              "b11, ( a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10),",
              "b21, (-a21 * a00 + a01 * a20), ( a11 * a00 - a01 * a10)) / det;",
"}",

//for dynamic, avoid computing the matrices on the cpu
"attribute vec3 instancePosition;",
"attribute vec4 instanceQuaternion;",
"attribute vec3 instanceScale;",

"#if defined( INSTANCE_COLOR )",
  "attribute vec3 instanceColor;",
  "varying vec3 vInstanceColor;",
"#endif",

"mat4 getInstanceMatrix(){",

  "vec4 q = instanceQuaternion;",
  "vec3 s = instanceScale;",
  "vec3 v = instancePosition;",

  "vec3 q2 = q.xyz + q.xyz;",
  "vec3 a = q.xxx * q2.xyz;",
  "vec3 b = q.yyz * q2.yzz;",
  "vec3 c = q.www * q2.xyz;",

  "vec3 r0 = vec3( 1.0 - (b.x + b.z) , a.y + c.z , a.z - c.y ) * s.xxx;",
  "vec3 r1 = vec3( a.y - c.z , 1.0 - (a.x + b.z) , b.y + c.x ) * s.yyy;",
  "vec3 r2 = vec3( a.z + c.y , b.y - c.x , 1.0 - (a.x + b.x) ) * s.zzz;",

  "return mat4(",

      "r0 , 0.0,",
      "r1 , 0.0,",
      "r2 , 0.0,",
      "v  , 1.0",

  ");",

"}",

"#endif"

].join("\n");


},{}]},{},[1]);
