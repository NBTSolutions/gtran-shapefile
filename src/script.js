'use strict';

var shp = require('shp-write');
var fs = require('fs');
var async = require('async');

exports.fromGeoJson = function(geojson, fileName, options, callback) {

    var esriWKT;
    if (options) {
      esriWKT = options.esriWKT;
    }

    var geoms = [];
    var properties = [];
    geojson.features.forEach(function(feature) {
        geoms.push(feature.geometry.coordinates);

        for (var key in feature.properties) {
            if (!feature.properties[key]) {
                feature.properties[key] = ' ';
            }
        }
        properties.push(feature.properties);
    });

    var geomType;
    switch(geojson.features[0].geometry.type) {
        case 'Point':
        case 'MultiPoint':
            geomType = 'POINT';
            break;
        case 'LineString':
        case 'MultiLineString':
            geomType = 'POLYLINE';
            break;
        case 'Polygon':
        case 'MultiPolygon':
            geomType = 'POLYGON';
            break;
        default:
            callback(new error('Given geometry type is not supported'));
            break;
    }

    shp.write(properties, geomType, geoms, function(err, files) {

        var fileNameWithoutExt = fileName;
        if(fileNameWithoutExt.indexOf('.shp') !== -1) {
            fileNameWithoutExt = fileNameWithoutExt.replace('.shp', '');
        }

        var tasks = [
            fs.writeFile(fileNameWithoutExt + '.shp', toBuffer(files.shp.buffer)),
            fs.writeFile(fileNameWithoutExt + '.shx', toBuffer(files.shx.buffer)),
            fs.writeFile(fileNameWithoutExt + '.dbf', toBuffer(files.dbf.buffer))
        ];

        if (esriWKT) {
          tasks.writeFile(fileNameWithoutExt + '.prj', esriWKT);
        }

        async.parallel(tasks, function(err) {

           var fileNames = [
               fileNameWithoutExt + '.shp',
               fileNameWithoutExt + '.shx',
               fileNameWithoutExt + '.dbf'
           ];

           if (esriWKT) {
             fileNames.push(fileNameWithoutExt + '.prj');
           }

            callback(err, fileNames);
        });
    });
}

function toBuffer(ab) {
    var buffer = new Buffer(ab.byteLength),
        view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) { buffer[i] = view[i]; }
    return buffer;
}
