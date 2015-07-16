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


require("/scripts/.js");
  require("js/killring.js");
  require("js/history.js");
  require("js/readline.js");
  require("js/shell.js");
  require("js/pathhandler.js");
  require("js/input.js");



$(document).ready(function() {
	var history = new Josh.History({ key: 'josh.helloworld'});
	var shell = Josh.Shell({history: history});
	var promptCounter = 0;
	shell.onNewPrompt(function(callback) {
		promptCounter++;
		callback("[" + promptCounter + "] $");
	    });
	shell.setCommandHandler("hello", {
		exec: function(cmd, args, callback) {
		    var arg = args[0] || '';
          var response = "who is this " + arg + " you are talking to?"\
	      ;
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