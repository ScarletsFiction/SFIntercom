/*
	ScarletsFiction Intercom
	Client-side cross-tab communication in a single web browser
	https://github.com/ScarletsFiction/SFIntercom
	
	Make sure you include this header on this script
*/

var SFIntercom = function(){
	var self = this;
	self.available = true;
	var callbacks = {};

	// Try use Broadcast Channel API
	if(window.BroadcastChannel){
		var bc = new BroadcastChannel(window.origin);
		window.addEventListener('beforeunload', function(){
			bc.close();
		}, {once:true});

		bc.onmessage = function(ev){
			if(ev.origin !== window.origin) return;
	  		onMessage(ev.data.key, ev.data.values);
		}

		self.emit = function(eventName, eventData, callback){
			if(eventData !== null && eventData !== void 0 && eventData.constructor === Function){
				callback = eventData;
				eventData = {};
			}

			if(callback !== void 0)
				eventData._clbkID = makeReCallback(callback);

			bc.postMessage({key:eventName, values:eventData});
		}
	}

	// Fallback to Shared Worker
	else if(window.SharedWorker){
		var worker = new SharedWorker('./SFIntercom_Worker.js');
		var intercomID = (new Date()).getTime();

		window.addEventListener('beforeunload', function(){
			worker.port.postMessage({intercomID:intercomID, command:'close'});
		}, {once:true});

  		worker.port.onmessage = function(ev){
	  		onMessage(ev.data.eventData.key, ev.data.eventData.values);
  		}

		self.emit = function(eventName, eventData, callback){
			if(eventData !== null && eventData !== void 0 && eventData.constructor === Function){
				callback = eventData;
				eventData = {};
			}

			if(callback !== void 0)
				eventData._clbkID = makeReCallback(callback);

			worker.port.postMessage({intercomID:intercomID, command:'emit', eventData:{key:eventName, values:eventData}});
		}
	}

	// Fallback to Local Storage
	else if(window.localStorage){
		var prefix = "sfintercom#"; //just a unique id for key-naming

		// Register cleanup event when user closed the tab
		var cleanup = {};
		window.addEventListener('beforeunload', function(){
			var keys = Object.keys(cleanup);
			for (var i = 0; i < keys.length; i++) {
				cleanup[keys[i]]();
				delete cleanup[keys[i]];
			}
		}, {once:true});

		// Register message event when something changes
		window.addEventListener('storage', function(ev){
	  		onMessage(ev.originalEvent.key, ev.originalEvent.newValue);
		});

		// Broadcast event to other tabs
		self.emit = function(eventName, eventData, callback){
			if(eventData !== null && eventData !== void 0 && eventData.constructor === Function){
				callback = eventData;
				eventData = {};
			}

			if(callback !== void 0)
				eventData._clbkID = makeReCallback(callback);

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
		self.available = false;
		return;
	}

	var reCallback = {};
	function makeReCallback(callback){
		var rand = Math.round(Math.random()*1e9);
		var sT = setTimeout(function(){
			delete reCallback[rand];
		}, 1e4);

		reCallback[rand] = function(val){
			callback(val.val, function(val2, callback){
				self.emit('_reCallback.', {
					val:val2,
					_callID:val._clbkID,
					_clbkID:makeReCallback(callback)
				});
			});

			delete reCallback[rand];
			clearTimeout(sT);
		};

		return rand;
	}

	function onMessage(key, val){
		var recall = function(val2, callback){
			self.emit('_reCallback.', {
				val:val2,
				_callID:val._clbkID,
				_clbkID:makeReCallback(callback)
			});
		};

		// From another callback
		if(key === '_reCallback.'){
			reCallback[val._callID](val, recall);
			return;
		}

		if(callbacks[key] === void 0)
			return;

		for (var i = 0; i < callbacks[key].length; i++) {
			if(callbacks[key][i](val, recall)) return;
		}
	}

	// Add Event listener from other tabs
	self.on = function(eventName, func){
		if(!callbacks[eventName]) callbacks[eventName] = [];
		if(callbacks[eventName].indexOf(func) === -1)
			callbacks[eventName].push(func);
	}

	// Remove event listener
	self.off = function(eventName, func){
		if(!callbacks[eventName]) return;
		var index = callbacks[eventName].indexOf(func);
		if(index !== -1)
			callbacks[eventName].splice(index, 1);
	}
};
