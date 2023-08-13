
const fileInput = document.getElementById('file-input');
let jlayer = [];

fileInput.addEventListener(
    "change",
    (event) => {
        gpx(event.target.files);
    }
);


// function clearLocalStorage() {localStorage.clear()};
function clearLocalStorage() {
    for ( LRoute of jlayer) {
        LRoute.remove();
    }
};




function gpx(files) {
    let routesInLocalStorage = {};
    for (let file of files) {
        let fileObject = new FileReader();
        fileObject.onload = function(e) {
            let content = e.target.result;
            let doc = new DOMParser().parseFromString(content, "text/xml");
            
            let trk = doc.getElementsByTagName('trk');
            // let rte = doc.getElementsByTagName('rte');
            // let wpt = doc.getElementsByTagName('wpt');
            let gj = fc();

            for (let trk_item of trk) {
                feature = getTrack(trk_item);
                if (feature) {
                    gj.features.push(feature);
                    r = feature;
                    routesInLocalStorage[feature.properties.name] = r;

                }
            }

            jlayer.push(L.geoJSON(gj));

            for (let item of jlayer) {
                item.addTo(map);
            }
            return gj;

        }
        fileObject.readAsText(file);
    }
}


function get(x, y) { return x.getElementsByTagName(y); }
function attr(x, y) { return x.getAttribute(y); }
function attrf(x, y) { return parseFloat(attr(x, y)); }

function get1(x, y) { var n = get(x, y); return n.length ? n[0] : null; }
// https://developer.mozilla.org/en-US/docs/Web/API/Node.normalize
function norm(el) { if (el.normalize) { el.normalize(); } return el; }

// add properties of Y to X, overwriting if present in both
function extend(x, y) { for (var k in y) x[k] = y[k]; }

function fc() {
    return {
        type: 'FeatureCollection',
        features: []
    };
}

function nodeVal(x) {
    if (x) { norm(x); }
    return (x && x.textContent) || '';
}

function getTrack(node) {
    var segments = get(node, 'trkseg'),
        track = [],
        times = [],
        heartRates = [],
        line;
    for (var i = 0; i < segments.length; i++) {
        line = getPoints(segments[i], 'trkpt');
        if (line) {
            if (line.line) track.push(line.line);
            if (line.times && line.times.length) times.push(line.times);
            if (heartRates.length || (line.heartRates && line.heartRates.length)) {
                if (!heartRates.length) {
                    for (var s = 0; s < i; s++) {
                        heartRates.push(initializeArray([], track[s].length));
                    }
                }
                if (line.heartRates && line.heartRates.length) {
                    heartRates.push(line.heartRates);
                } else {
                    heartRates.push(initializeArray([], line.line.length || 0));
                }
            }
        }
    }
    if (track.length === 0) return;
    var properties = getProperties(node);
    extend(properties, getLineStyle(get1(node, 'extensions')));
    if (times.length) properties.coordTimes = track.length === 1 ? times[0] : times;
    if (heartRates.length) properties.heartRates = track.length === 1 ? heartRates[0] : heartRates;
    return {
        type: 'Feature',
        properties: properties,
        geometry: {
            type: track.length === 1 ? 'LineString' : 'MultiLineString',
            coordinates: track.length === 1 ? track[0] : track
        }
    };
}

function getPoints(node, pointname) {
    var pts = get(node, pointname),
        line = [],
        times = [],
        heartRates = [],
        l = pts.length;
    if (l < 2) return {};  // Invalid line in GeoJSON
    for (var i = 0; i < l; i++) {
        var c = coordPair(pts[i]);
        line.push(c.coordinates);
        if (c.time) times.push(c.time);
        if (c.heartRate || heartRates.length) {
            if (!heartRates.length) initializeArray(heartRates, i);
            heartRates.push(c.heartRate || null);
        }
    }
    return {
        line: line,
        times: times,
        heartRates: heartRates
    };
}

function getProperties(node) {
    var prop = getMulti(node, ['name', 'cmt', 'desc', 'type', 'time', 'keywords']),
        links = get(node, 'link');
    if (links.length) prop.links = [];
    for (var i = 0, link; i < links.length; i++) {
        link = { href: attr(links[i], 'href') };
        extend(link, getMulti(links[i], ['text', 'type']));
        prop.links.push(link);
    }
    return prop;
}

function getPoint(node) {
    var prop = getProperties(node);
    extend(prop, getMulti(node, ['sym']));
    return {
        type: 'Feature',
        properties: prop,
        geometry: {
            type: 'Point',
            coordinates: coordPair(node).coordinates
        }
    };
}

function getLineStyle(extensions) {
    var style = {};
    if (extensions) {
        var lineStyle = get1(extensions, 'line');
        if (lineStyle) {
            var color = nodeVal(get1(lineStyle, 'color')),
                opacity = parseFloat(nodeVal(get1(lineStyle, 'opacity'))),
                width = parseFloat(nodeVal(get1(lineStyle, 'width')));
            if (color) style.stroke = color;
            if (!isNaN(opacity)) style['stroke-opacity'] = opacity;
            // GPX width is in mm, convert to px with 96 px per inch
            if (!isNaN(width)) style['stroke-width'] = width * 96 / 25.4;
        }
    }
    return style;
}

function coordPair(x) {
    var ll = [attrf(x, 'lon'), attrf(x, 'lat')],
        ele = get1(x, 'ele'),
        // handle namespaced attribute in browser
        heartRate = get1(x, 'gpxtpx:hr') || get1(x, 'hr'),
        time = get1(x, 'time'),
        e;
    if (ele) {
        e = parseFloat(nodeVal(ele));
        if (!isNaN(e)) {
            ll.push(e);
        }
    }
    return {
        coordinates: ll,
        time: time ? nodeVal(time) : null,
        heartRate: heartRate ? parseFloat(nodeVal(heartRate)) : null
    };
}

// get the contents of multiple text nodes, if present
function getMulti(x, ys) {
    var o = {}, n, k;
    for (k = 0; k < ys.length; k++) {
        n = get1(x, ys[k]);
        if (n) o[ys[k]] = nodeVal(n);
    }
    return o;
}

