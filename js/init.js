function loadScript(url, callback)
{
    // Adding the script tag to the head as suggested before
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
}

loadScript("killring.js", init);
loadScript("history.js", init);
loadScript("readline.js", init);
loadScript("shell.js", init);
loadScript("pathhandler.js", init);
loadScript("input.js", init);

var init = $(document).ready(function() {
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