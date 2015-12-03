'use strict';

var shp = require('shp-write');
var fs = require('fs');
var async = require('async');

exports.fromGeoJson = function(geojson, fileName, callback) {

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

        async.parallel([
            fs.writeFile(fileNameWithoutExt + '.shp', toBuffer(files.shp.buffer)),
            fs.writeFile(fileNameWithoutExt + '.shx', toBuffer(files.shx.buffer)),
            fs.writeFile(fileNameWithoutExt + '.dbf', toBuffer(files.dbf.buffer))
        ], function(err) {
            callback(err, [
                fileNameWithoutExt + '.shp',
                fileNameWithoutExt + '.shx',
                fileNameWithoutExt + '.dbf'
            ]);
        });
    });
}

function toBuffer(ab) {
    var buffer = new Buffer(ab.byteLength),
        view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) { buffer[i] = view[i]; }
    return buffer;
}
