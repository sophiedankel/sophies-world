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