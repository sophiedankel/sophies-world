function require(script) {
    $.ajax({
	    url: script,
		dataType: "script",
		async: false,           // <-- This is the key
		success: function () {
		// all good...
	    },
		error: function () {
		throw new Error("Could not load script " + script);
	    }
	});
}

// Import dependencies
var path = "js/"
var scripts = [
    "killring.js",
    "history.js",
    "readline.js",
    "shell.js",
    "pathhandler.js",
    "input.js" ];

for(index = 0; index < scripts.length; index++) {
    require(path + scripts[index]);
}


var Josh = Josh || {};
$(document).ready(function() {
	var history = new Josh.History({ key: 'josh.helloworld'});
	var shell = Josh.Shell({history: history});
	shell.onNewPrompt(function(callback) {
		callback("sophies-world $");
	    });
	shell.setCommandHandler("hello", {
		exec: function(cmd, args, callback) {
		    var arg = args[0] || '';
          var response = "who is this " + arg + " you are talking to?";
          if(arg === 'josh') {
	      response = 'pleased to meet you.';
          } else if(arg === 'world') {
            response = 'world says hi.'
		} else if(!arg) {
	      response = 'who are you saying hello to?';
          }
          callback(response);
		},
		    completion: function(cmd, arg, line, callback) {
		    callback(shell.bestMatch(arg, ['world', 'josh']))
			}
	    });
	shell.activate();
    });