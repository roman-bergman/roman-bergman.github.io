
let map = new L.map(
    'map',
    {
        center: [48.423313, 35.001642],
        zoom: 10,
        attributionControl: false,
    }
);

L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png', 
    {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
).addTo(map);


// let circle = L.circle([48.467373, 35.043233], {
//     color: 'red',
//     fillColor: '#f03',
//     fillOpacity: 0.2,
//     radius: 100000
// }).addTo(map);

// let marker = L.marker([48.41581, 34.73598]).addTo(map);
// let marker2 = L.marker([48.48142, 35.00356]).addTo(map);
// let marker = L.marker([48.41581, 34.73598]).addTo(map);
// let marker = L.marker([48.41581, 34.73598]).addTo(map);
// marker.bindPopup('<b>Hello world!</b><br />I am a popup.');



function onMapClick(e) {
    L.popup()
        .setLatLng(e.latlng)
        .setContent('You clicked the map at ' + e.latlng.toString() + ` Zoom: ${map.getZoom()}`)
        .openOn(map);
}

// map.on('click', onMapClick);





