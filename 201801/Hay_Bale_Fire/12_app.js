var noble = require("noble");
var express = require('express');

var app = express();

app.get("/:cpu/:temp/:humidity", (req, res) => {
  res.send("Hello, world");  // Just to respond with something
  console.log(`${req.params.cpu} reports ${req.params.temp} C and ${req.params.humidity}%`);
});

var devTypeID = "ebdd49acb2e740eb55f5d0ab";

var plugService = "a22bd383" + devTypeID;
var plugChars = {
	"top": "a22b0090" + devTypeID,
	"bottom": "a22b0095" + devTypeID
};

var plugServices = [plugService];
var plugCharacteristics = Object.keys(plugChars).map(k => plugChars[k]);
var plugAPI = {};



var readPlug = (plug, cb) => {
	plug.read((err, data) => {
		cb(data[0] !== 0);
	});
};



var writePlug = (plug, val, cb) => {
	plug.write(Buffer.from([val ? 1 : 0]), true, (err) => {
		cb();
	});
};


var togglePlug = (plug) => {
	readPlug(plug, currentVal => writePlug(plug, !currentVal, () => {}));
};


var plugDiscovered = plugDevice => {
	noble.stopScanning();

	plugDevice.once("connect", () => {
		console.log("Connected to the plug through Bluetooth");

		plugDevice.discoverSomeServicesAndCharacteristics(plugServices, plugCharacteristics,
			(err, services, charObjs) => {
				Object.keys(plugChars).map((plugName) => {
					plugAPI[plugName] = charObjs.filter(c => c.uuid === plugChars[plugName])[0];
				});
			
				console.log("APIs: " + Object.keys(plugAPI));

				setInterval(() => togglePlug(plugAPI.top), 1000);
				setInterval(() => togglePlug(plugAPI.bottom), 990);			
		});  // plugDevice.discoverSoServicesAndCharacteristics

	});    // plugDevice.once("connect")

	plugDevice.connect();
};


noble.on("stateChange", state => console.log("Bluetooth state is now " + state));
noble.on("discover", plugDiscovered);
noble.startScanning(plugServices);

// Star the web server. Listen to all IP addresses
app.listen(80, '0.0.0.0', () => {console.log("Web server started"});
