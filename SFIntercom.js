/*
	ScarletsFiction Intercom Library v1.1
	Client-side cross-tab communication in a single web browser
	https://github.com/ScarletsFiction/SFIntercom
	
	Make sure you include this header on this script
*/

var SFIntercom = function(){
	var scope = this;
	scope.available = true;
	var callbacks = {};

	// Try use Broadcast Channel API
	if(window.BroadcastChannel){
		var bc = new BroadcastChannel(document.origin);
		$(window).one('beforeunload', function(){
			bc.close();
		});
		bc.onmessage = function(ev){
			if(ev.origin != document.origin) return;
		  	if(callbacks[ev.data.key])
		  		for (var i = 0; i < callbacks[ev.data.key].length; i++) {
		  			if(callbacks[ev.data.key][i](ev.data.values)) return;
		  		}
		}
		scope.emit = function(eventName, eventData){
			bc.postMessage({key:eventName, values:eventData});
		}
	}

	// Fallback to Shared Worker
	else if(window.SharedWorker){
		var worker = new SharedWorker('SFIntercom_Worker.js');
		var intercomID = (new Date()).getTime();
		$(window).one('beforeunload', function(){
			worker.port.postMessage({intercomID:intercomID, command:'close'});
		});
  		worker.port.onmessage = function(ev){
		  	if(callbacks[ev.data.eventData.key])
		  		for (var i = 0; i < callbacks[ev.data.eventData.key].length; i++) {
		  			if(callbacks[ev.data.eventData.key][i](ev.data.eventData.values)) return;
		  		}
  		}
		scope.emit = function(eventName, eventData){
			worker.port.postMessage({intercomID:intercomID, command:'emit', eventData:{key:eventName, values:eventData}});
		}
	}

	// Fallback to Local Storage
	else if(window.localStorage){
		var prefix = "sfintercom#"; //just a unique id for key-naming

		// Register cleanup event when user closed the tab
		var cleanup = {};
		$(window).one('beforeunload', function(){
			var keys = Object.keys(cleanup);
			for (var i = 0; i < keys.length; i++) {
				cleanup[keys[i]]();
				delete cleanup[keys[i]];
			}
		});

		// Register message event when something changes
		$(window).on('storage', function(ev){
		  	if(callbacks[ev.originalEvent.key])
		  		for (var i = 0; i < callbacks[ev.originalEvent.key].length; i++) {
		  			if(callbacks[ev.originalEvent.key][i](ev.originalEvent.newValue)) return;
		  		}
		});

		// Broadcast event to other tabs
		scope.emit = function(eventName, eventData){
			var localStorageKey = prefix + eventName;

			// Trigger `storage` event on all tab except this tab
			localStorage.setItem(localStorageKey, eventData);

			// Prepare clean up
			cleanup[localStorageKey] = function(){
				localStorage.removeItem(localStorageKey);
			};

			setTimeout(function(){
				if(cleanup[localStorageKey]){
					cleanup[localStorageKey]();
					delete cleanup[localStorageKey];
				}
			}, 3000);
		}
	}
	else{
		scope.available = false;
		return;
	}

	// Add Event listener from other tabs
	scope.on = function(eventName, func){
		if(!callbacks[eventName]) callbacks[eventName] = [];
		if(callbacks[eventName].indexOf(func)==-1)
			callbacks[eventName].push(func);
	}

	// Remove event listener
	scope.off = function(eventName, func){
		if(!callbacks[eventName]) return;
		var index = callbacks[eventName].indexOf(func);
		if(index!=-1)
			callbacks[eventName].splice(index, 1);
	}
};