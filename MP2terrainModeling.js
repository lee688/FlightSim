/**
 * @author lee688@illinois.edu (Byungsuk Lee)
 * Comments added only to the functions newly added and/or altered.
 * Original template from terrainModeling.js provided on the course website. 
 */



// Generate terrain by first creating the arrays and then using the Diamond Square Algorithm.
// @param n the number of terrain tiles
// @param minX the minimum x coordinate or the terrain
// @param maxX the maximum x coordinate or the terrain
// @param minY the minimum y coordinate or the terrain
// @param maxY the maximum y coordinate or the terrain
// @param scale the scaling value for the z coordinate of each terrain vertex. 
// @param vertexArray the vertex array for the terrain
// @param faceArray the triangular face index array for the terrain
// @param normalArray the normal array for each vertex of the terrain
// @param colorArray the color array for each vertex of the terrain
// @return numT the number of mesh triangles for the terrain.
function terrainFromIteration(n, minX, maxX, minY, maxY, scale, vertexArray, faceArray, normalArray, colorArray) 
{
    var deltaX=(maxX-minX)/n;
    var deltaY=(maxY-minY)/n;
    for(var i=0;i<=n;i++) {
        for(var j=0;j<=n;j++) {
           vertexArray.push(minX+deltaX*j);
           vertexArray.push(minY+deltaY*i);
           vertexArray.push(0);
           
           normalArray.push(0);
           normalArray.push(0);
           normalArray.push(0);   
        }
    }
    
    // Create another vertex array that is 3x3 expansion of the original vertexArray.
    // z coordinate of this new array gets a random value assigned.
    var vertexArray2 = [];
    for(var i=0;i<=3*n;i++) {
        for(var j=0;j<=3*n;j++) {
           vertexArray2.push(minX+deltaX*j);
           vertexArray2.push(minY+deltaY*i);
           vertexArray2.push(getRandomValue(0,scale/4));
        }
    }
    
    // Diamond Square Algorithm is applied to the new expanded array
    var samplesize = n;
    terrainDiamondSquare0(n,scale,samplesize,vertexArray2);
    // Take the z coordinates of the central (n+1)x(n+1) part of the expanded array and assign them to the original vertexArray.
    for(var i=0;i<=n;i++) {
        for(var j=0;j<=n;j++) {
           vertexArray[get1DindexofZ(n,i,j)] = vertexArray2[get1DindexofZ(3*n,i+n,j+n)];
        }
    }
        
    var vertexArrayZMax = getMaxZ(n, vertexArray);
    var vertexArrayZMin = getMinZ(n, vertexArray);
    var vertexArrayZrange = vertexArrayZMax-vertexArrayZMin;
    
    // Assign color to the terrain based on its height(= z coordinate). 
    var colorRate = 0;
    for(var i=0;i<=n;i++) {
        for(var j=0;j<=n;j++) {
           colorRate = (vertexArray[get1DindexofZ(n,i,j)]-vertexArrayZMin)/(vertexArrayZrange);
           colorArray.push((colorRate)*0.5);
           colorArray.push(colorRate);
           colorArray.push(Math.pow(1-colorRate,2));  
        }
    }

    var numT=0;
    for(var i=0;i<n;i++) {
        for(var j=0;j<n;j++) {
           var vid = i*(n+1) + j;
           faceArray.push(vid);
           faceArray.push(vid+1);
           faceArray.push(vid+n+1);
           
           faceArray.push(vid+1);
           faceArray.push(vid+1+n+1);
           faceArray.push(vid+n+1);
           numT+=2;
        }
    }
    
    // Calculate the normal array based on the trangles formed. 
    for (var i=0;i<numT;i++) {           
        // Loop over the number of triangles.
        
        // Get the vertexArray index for each point of the triangle.
        var t1 = faceArray[3*i];
        var t2 = faceArray[3*i+1];
        var t3 = faceArray[3*i+2];
        
        // Get the corresponding xyz coordinates of each vertex of the triangle
        var v1 = vec3.fromValues(vertexArray[3*t1], vertexArray[3*t1+1], vertexArray[3*t1+2]);
        var v2 = vec3.fromValues(vertexArray[3*t2], vertexArray[3*t2+1], vertexArray[3*t2+2]);
        var v3 = vec3.fromValues(vertexArray[3*t3], vertexArray[3*t3+1], vertexArray[3*t3+2]);
        
        // Get the cross product and therefore normal of the triangle.
        var tNormal = vec3.create();
        var vector1 = vec3.create();
        var vector2 = vec3.create();
         
        vec3.subtract(vector1,v2,v1);   
        vec3.subtract(vector2,v3,v1);
        vec3.cross(tNormal,vector1,vector2);
        
        // Add up the triangle's normal to each of its vertices. 
        normalArray[3*t1] = normalArray[3*t1] + tNormal[0];
        normalArray[3*t1+1] = normalArray[3*t1+1] + tNormal[1];
        normalArray[3*t1+2] = normalArray[3*t1+2] + tNormal[2];
        
        normalArray[3*t2] = normalArray[3*t2] + tNormal[0];
        normalArray[3*t2+1] = normalArray[3*t2+1] + tNormal[1];
        normalArray[3*t2+2] = normalArray[3*t2+2] + tNormal[2];
    
        normalArray[3*t3] = normalArray[3*t3]+ tNormal[0];
        normalArray[3*t3+1] = normalArray[3*t3+1] +tNormal[1];
        normalArray[3*t3+2] = normalArray[3*t3+2] + tNormal[2];  
    }
    // Normalize the normalArray. 
    vec3.normalize(normalArray,normalArray);
    
    return numT;
}



//-------------------------------------------------------------------------
function generateLinesFromIndexedTriangles(faceArray,lineArray)
{
    numTris=faceArray.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        lineArray.push(faceArray[fid]);
        lineArray.push(faceArray[fid+1]);
        
        lineArray.push(faceArray[fid+1]);
        lineArray.push(faceArray[fid+2]);
        
        lineArray.push(faceArray[fid+2]);
        lineArray.push(faceArray[fid]);
    }
}



// @param n the grid size of the xyz-coordinate array.
// @param x the x index in the array
// @param y the y index in the array
// @return the z index of the (x,y) in the array
function get1DindexofZ(n,x,y) 
{
    return y*(n+1)*3 + x*3 -1 + 3;
}



// @param min one end of the range
// @param max the other end of the range
// @return the randomly generated value between min and max. 
function getRandomValue(min,max) 
{
    return Math.random()*(max-min) + min;
}



// @param n the grid size of the vertex array
// @param vertexArray the vertex array
// @return the maximum z coordinate (height) of the vertex array
function getMaxZ(n, vertexArray) 
{
    var vertexArrayZ = [];
    for (var i = 0; i <= n; i++) {
        for (var j = 0; j <= n; j++) {
            vertexArrayZ.push(vertexArray[get1DindexofZ(n,i,j)]);
        }
    }
    return Math.max(...vertexArrayZ);
}



// @param n the grid size of the vertex array
// @param vertexArray the vertex array
// @return the minimum z coordinate (height) of the vertex array
function getMinZ(n, vertexArray) 
{
    var vertexArrayZ = [];
    for (var i = 0; i <= n; i++) {
        for (var j = 0; j <= n; j++) {
            vertexArrayZ.push(vertexArray[get1DindexofZ(n,i,j)]);
        }
    }
    return Math.min(...vertexArrayZ);
}



// Diamond Square Algorithm is applied to the expanded vertex array.
// @param n the grid size of the vertex array we are ultimately interested in for terrain generation
// @param scale the scaling value for the heights of each terrain vertex
// @param level the conditional value to determine the step of Diamond Square Algorithm
// @param vertexArray2 the expanded vertex array from which the ultimate vertex array takes its height values
function terrainDiamondSquare0(n, scale,  level, vertexArray2) 
{
    if (level < 2) return;

    x1 = n;
    y1 = n;
    x2 = 2*n;
    y2 = 2*n;
    
    // Diamond Step
    for (var i = x1 + level; i <= x2; i += level) {
        for (var j = y1 + level; j <= y2; j += level) {
            var z11 = vertexArray2[get1DindexofZ(3*n,i - level,j - level)]; 
            var z21 = vertexArray2[get1DindexofZ(3*n,i,j - level)];
            var z12 = vertexArray2[get1DindexofZ(3*n,i - level,j)];
            var z22 = vertexArray2[get1DindexofZ(3*n,i,j)];
            vertexArray2[get1DindexofZ(3*n,i - level/2,j - level/2)] = (z11 + z21 + z12 + z22) / 4 + getRandomValue(0,scale);
        } }

    // Square Step
    for ( var i = x1 +  level; i <= x2; i += level) {
        for ( var j = y1 +  level; j <= y2; j += level) {
            var z11 = vertexArray2[get1DindexofZ(3*n,i - level,j - level)];
            var z21 = vertexArray2[get1DindexofZ(3*n,i ,j - level)];
            var z12 = vertexArray2[get1DindexofZ(3*n,i - level,j )];
            var z22 = vertexArray2[get1DindexofZ(3*n,i ,j )];
            var zMiddle = vertexArray2[get1DindexofZ(3*n,i - level/2,j - level/2)];
            
            vertexArray2[get1DindexofZ(3*n,i - level,j - level/2)] = (z11 + z12 + zMiddle + vertexArray2[get1DindexofZ(3*n,i - 3*level/2,j - level/2)])/4 + getRandomValue(0,scale);
            vertexArray2[get1DindexofZ(3*n,i - level/2,j - level)] = (z11 + z21 + zMiddle + vertexArray2[get1DindexofZ(3*n,i - level/2,j - 3*level/2)])/4 + getRandomValue(0,scale);
        } }

    terrainDiamondSquare0(n, -scale/2, level/2,  vertexArray2);
}
