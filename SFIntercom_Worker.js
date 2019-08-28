/*
	ScarletsFiction Intercom Worker
	Client-side cross-tab communication in a single web browser
	https://github.com/ScarletsFiction/SFIntercom
	
	Make sure you include this header on this script
*/

var connections = {};
onconnect = function(e){
	e.ports[0].onmessage = function(ev){
		if(!connections[ev.data.intercomID])
	    	connections[ev.data.intercomID] = e.ports[0];

		if(ev.data.command === 'close')
			delete connections[ev.data.intercomID];
		else if(ev.data.command === 'emit'){
			var keys = Object.keys(connections);

			for(var i = 0; i < keys.length; i++){
				if(ev.data.intercomID === keys[i]) continue;
				connections[keys[i]].postMessage(ev.data.eventData);
			}
		}
	}
};