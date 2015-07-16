
var Josh = Josh || {};
Josh.Version = "0.2.10";


(function (root) {

    /* Killring */
      Josh.KillRing = function(config) {
    config = config || {};

    var _console = Josh.Debug && root.console ? root.console : {log: function() {
    }};
    var _ring = config.ring || [];
    var _cursor = config.cursor || 0;
    var _uncommitted = false;
    var _yanking = false;
    if(_ring.length == 0) {
      _cursor = -1;
    } else if(_cursor >= _ring.length) {
      _cursor = _ring.length - 1;
    }
    var self = {
      isinkill: function() {
        return _uncommitted;
      },
      lastyanklength: function() {
        if(!_yanking) {
          return 0;
        }
        return _ring[_cursor].length;
      },
      append: function(value) {
        _yanking = false;
        if(!value) {
          return;
        }
        if(_ring.length == 0 || !_uncommitted) {
          _ring.push('');
        }
        _cursor = _ring.length - 1;
        _console.log("appending: " + value);
        _uncommitted = true;
        _ring[_cursor] += value;
      },
      prepend: function(value) {
        _yanking = false;
        if(!value) {
          return;
        }
        if(_ring.length == 0 || !_uncommitted) {
          _ring.push('');
        }
        _cursor = _ring.length - 1;
        _console.log("prepending: " + value);
        _uncommitted = true;
        _ring[_cursor] = value + _ring[_cursor];
      },
      commit: function() {
        _console.log("committing");
        _yanking = false;
        _uncommitted = false;
      },
      yank: function() {
        self.commit();
        if(_ring.length == 0) {
          return null;
        }
        _yanking = true;
        return _ring[_cursor];
      },
      rotate: function() {
        if(!_yanking || _ring.length == 0) {
          return null;
        }
        --_cursor;
        if(_cursor < 0) {
          _cursor = _ring.length - 1;
        }
        return self.yank();
      },
      items: function() {
        return _ring.slice(0);
      },
      clear: function() {
        _ring = [];
        _cursor = -1;
        _yanking = false;
        _uncommited = false;
      }
    };
    return self;
  }

    

    /* History */
    Josh.History = function (config) {
    config = config || {};

    var _console = Josh.Debug && root.console ? root.console : {log: function() {}};
    var _history = config.history || [''];
    var _cursor = config.cursor || 0;
    var _searchCursor = _cursor;
    var _lastSearchTerm = '';
    var _storage = config.storage || root.localStorage;
    var _key = config.key || 'josh.history';

    if (_storage) {
   //   try {
        var data = _storage.getItem(_key);
   //   } catch(e) {
   //     _console.log("Error accessing storage");
   //   }
      if (data) {
        _history = JSON.parse(data);
        _searchCursor = _cursor = _history.length - 1;
      } else {
        save();
      }
    }
    function save() {
      if (_storage) {
      //  try {
          _storage.setItem(_key, JSON.stringify(_history));
      //  } catch(e) {
      //    _console.log("Error accessing storage");
      //  }
      }
    }

    function setHistory() {
      _searchCursor = _cursor;
      _lastSearchTerm = '';
      return _history[_cursor];
    }

    return {
      update:function (text) {
        _console.log("updating history to " + text);
        _history[_cursor] = text;
        save();
      },
      accept:function (text) {
        _console.log("accepting history " + text);
        var last = _history.length - 1;
        if (text) {
          if (_cursor == last) {
            _console.log("we're at the end already, update last position");
            _history[_cursor] = text;
          } else if (!_history[last]) {
            _console.log("we're not at the end, but the end was blank, so update last position");
            _history[last] = text;
          } else {
            _console.log("appending to end");
            _history.push(text);
          }
          _history.push('');
        }
        _searchCursor = _cursor = _history.length - 1;
        save();
      },
      items:function () {
        return _history.slice(0, _history.length - 1);
      },
      clear:function () {
        _history = [_history[_history.length - 1]];
        save();
      },
      hasNext:function () {
        return _cursor < (_history.length - 1);
      },
      hasPrev:function () {
        return _cursor > 0;
      },
      prev:function () {
        --_cursor;
        return setHistory();
      },
      next:function () {
        ++_cursor;
        return setHistory();
      },
      top:function () {
        _cursor = 0;
        return setHistory();
      },
      end:function () {
        _cursor = _history.length - 1;
        return setHistory();
      },
      search:function (term) {
        if (!term && !_lastSearchTerm) {
          return null;
        }
        var iterations = _history.length;
        if (term == _lastSearchTerm) {
          _searchCursor--;
          iterations--;
        }
        if (!term) {
          term = _lastSearchTerm;
        }
        _lastSearchTerm = term;
        for (var i = 0; i < iterations; i++) {
          if (_searchCursor < 0) {
            _searchCursor = _history.length - 1;
          }
          var idx = _history[_searchCursor].indexOf(term);
          if (idx != -1) {
            return {
              text:_history[_searchCursor],
              cursoridx:idx,
              term:term
            };
          }
          _searchCursor--;
        }
        return null;
      },
      applySearch:function () {
        if (_lastSearchTerm) {
          _console.log("setting history to position" + _searchCursor + "(" + _cursor + "): " + _history[_searchCursor]);
          _cursor = _searchCursor;
          return _history[_cursor];
        }
        return null;
      }
    };
    };




    /* Readline */
    Josh.Keys = {
    Special: {
      Backspace: 8,
      Tab: 9,
      Enter: 13,
      Pause: 19,
      CapsLock: 20,
      Escape: 27,
      Space: 32,
      PageUp: 33,
      PageDown: 34,
      End: 35,
      Home: 36,
      Left: 37,
      Up: 38,
      Right: 39,
      Down: 40,
      Insert: 45,
      Delete: 46
    }
  };

  Josh.ReadLine = function(config) {
    config = config || {};

    // instance fields
    var _console = config.console || (Josh.Debug && root.console ? root.console : {
      log: function() {
      }
    });
    var _history = config.history || new Josh.History();
    var _killring = config.killring || new Josh.KillRing();
    var _boundToElement = config.element ? true : false;
    var _element = config.element || root;
    var _active = false;
    var _onActivate;
    var _onDeactivate;
    var _onCompletion;
    var _onEnter;
    var _onChange;
    var _onCancel;
    var _onEOT;
    var _onClear;
    var _onSearchStart;
    var _onSearchEnd;
    var _onSearchChange;
    var _inSearch = false;
    var _searchMatch;
    var _lastSearchText = '';
    var _text = '';
    var _cursor = 0;
    var _lastCmd;
    var _completionActive;
    var _cmdQueue = [];
    var _suspended = false;
    var _cmdMap = {
      complete: cmdComplete,
      done: cmdDone,
      noop: cmdNoOp,
      history_top: cmdHistoryTop,
      history_end: cmdHistoryEnd,
      history_next: cmdHistoryNext,
      history_previous: cmdHistoryPrev,
      end: cmdEnd,
      home: cmdHome,
      left: cmdLeft,
      right: cmdRight,
      cancel: cmdCancel,
      'delete': cmdDeleteChar,
      backspace: cmdBackspace,
      kill_eof: cmdKillToEOF,
      kill_wordback: cmdKillWordBackward,
      kill_wordforward: cmdKillWordForward,
      yank: cmdYank,
      clear: cmdClear,
      search: cmdReverseSearch,
      wordback: cmdBackwardWord,
      wordforward: cmdForwardWord,
      yank_rotate: cmdRotate
  };
    var _keyMap = {
      'default': {
        8: cmdBackspace,    // Backspace
        9: cmdComplete,     // Tab
        13: cmdDone,        // Enter
        27: cmdEsc,         // Esc
        33: cmdHistoryTop,  // Page Up
        34: cmdHistoryEnd,  // Page Down
        35: cmdEnd,         // End
        36: cmdHome,        // Home
        37: cmdLeft,        // Left
        38: cmdHistoryPrev, // Up
        39: cmdRight,       // Right
        40: cmdHistoryNext, // Down
        46: cmdDeleteChar,  // Delete
        10: cmdNoOp,        // Pause
        19: cmdNoOp,        // Caps Lock
        45: cmdNoOp         // Insert
      },
      control: {
        65: cmdHome,          // A
        66: cmdLeft,          // B
        67: cmdCancel,        // C
        68: cmdDeleteChar,    // D
        69: cmdEnd,           // E
        70: cmdRight,         // F
        80: cmdHistoryPrev,   // P
        78: cmdHistoryNext,   // N
        75: cmdKillToEOF,     // K
        89: cmdYank,          // Y
        76: cmdClear,         // L
        82: cmdReverseSearch  // R
      },
      meta: {
        8: cmdKillWordBackward, // Backspace
        66: cmdBackwardWord,    // B
        68: cmdKillWordForward, // D
        70: cmdForwardWord,     // F
        89: cmdRotate           // Y
      }
    };

    // public methods
    var self = {
      isActive: function() {
        return _active;
      },
      activate: function() {
        _active = true;
        if(_onActivate) {
          _onActivate();
        }
      },
      deactivate: function() {
        _active = false;
        if(_onDeactivate) {
          _onDeactivate();
        }
      },
      bind: function(key, action) {
        var k = getKey(key);
        var cmd = _cmdMap[action];
        if(!cmd) {
          return;
        }
        _keyMap[k.modifier][k.code];
      },
      unbind: function(key) {
        var k = getKey(key);
        delete _keyMap[k.modifier][k.code];
      },
      attach: function(el) {
        if(_element) {
          self.detach();
        }
        _console.log("attaching");
        _console.log(el);
        _element = el;
        _boundToElement = true;
        addEvent(_element, "focus", self.activate);
        addEvent(_element, "blur", self.deactivate);
        subscribeToKeys();
      },
      detach: function() {
        removeEvent(_element, "focus", self.activate);
        removeEvent(_element, "blur", self.deactivate);
        _element = null;
        _boundToElement = false;
      },
      onActivate: function(completionHandler) {
        _onActivate = completionHandler;
      },
      onDeactivate: function(completionHandler) {
        _onDeactivate = completionHandler;
      },
      onChange: function(changeHandler) {
        _onChange = changeHandler;
      },
      onClear: function(completionHandler) {
        _onClear = completionHandler;
      },
      onEnter: function(enterHandler) {
        _onEnter = enterHandler;
      },
      onCompletion: function(completionHandler) {
        _onCompletion = completionHandler;
      },
      onCancel: function(completionHandler) {
        _onCancel = completionHandler;
      },
      onEOT: function(completionHandler) {
        _onEOT = completionHandler;
      },
      onSearchStart: function(completionHandler) {
        _onSearchStart = completionHandler;
      },
      onSearchEnd: function(completionHandler) {
        _onSearchEnd = completionHandler;
      },
      onSearchChange: function(completionHandler) {
        _onSearchChange = completionHandler;
      },
      getLine: function() {
        return {
          text: _text,
          cursor: _cursor
        };
      },
      setLine: function(line) {
        _text = line.text;
        _cursor = line.cursor;
        refresh();
      }
    };

    // private methods
    function addEvent(element, name, callback) {
      if(element.addEventListener) {
        element.addEventListener(name, callback, false);
      } else if(element.attachEvent) {
        element.attachEvent('on' + name, callback);
      }
    }

    function removeEvent(element, name, callback) {
      if(element.removeEventListener) {
        element.removeEventListener(name, callback, false);
      } else if(element.detachEvent) {
        element.detachEvent('on' + name, callback);
      }
    }

    function getKeyInfo(e) {
      var code = e.keyCode || e.charCode;
      var c = String.fromCharCode(code);
      return {
        code: code,
        character: c,
        shift: e.shiftKey,
        control: e.controlKey,
        alt: e.altKey,
        isChar: true
      };
    }

    function getKey(key) {
      var k = {
        modifier: 'default',
        code: key.keyCode
      };
      if(key.metaKey || key.altKey) {
        k.modifier = 'meta';
      } else if(key.ctrlKey) {
        k.modifier = 'control';
      }
      if(key['char']) {
        k.code = key['char'].charCodeAt(0);
      }
      return k;
    }

    function queue(cmd) {
      if(_suspended) {
        _cmdQueue.push(cmd);
        return;
      }
      call(cmd);
    }

    function call(cmd) {
      _console.log('calling: ' + cmd.name + ', previous: ' + _lastCmd);
      if(_inSearch && cmd.name != "cmdKeyPress" && cmd.name != "cmdReverseSearch") {
        _inSearch = false;
        if(cmd.name == 'cmdEsc') {
          _searchMatch = null;
        }
        if(_searchMatch) {
          if(_searchMatch.text) {
            _cursor = _searchMatch.cursoridx;
            _text = _searchMatch.text;
            _history.applySearch();
          }
          _searchMatch = null;
        }
        if(_onSearchEnd) {
          _onSearchEnd();
        }
      }
      if(!_inSearch && _killring.isinkill() && cmd.name.substr(0, 7) != 'cmdKill') {
        _killring.commit();
      }
      _lastCmd = cmd.name;
      cmd();
    }

    function suspend(asyncCall) {
      _suspended = true;
      asyncCall(resume);
    }

    function resume() {
      var cmd = _cmdQueue.shift();
      if(!cmd) {
        _suspended = false;
        return;
      }
      call(cmd);
      resume();
    }

    function cmdNoOp() {
      // no-op, used for keys we capture and ignore
    }

    function cmdEsc() {
      // no-op, only has an effect on reverse search and that action was taken in call()
    }

    function cmdBackspace() {
      if(_cursor == 0) {
        return;
      }
      --_cursor;
      _text = remove(_text, _cursor, _cursor + 1);
      refresh();
    }

    function cmdComplete() {
      if(!_onCompletion) {
        return;
      }
      suspend(function(resumeCallback) {
        _onCompletion(self.getLine(), function(completion) {
          if(completion) {
            _text = insert(_text, _cursor, completion);
            updateCursor(_cursor + completion.length);
          }
          _completionActive = true;
          resumeCallback();
        });
      });
    }

    function cmdDone() {
      if(!_text) {
        return;
      }
      var text = _text;
      _history.accept(text);
      _text = '';
      _cursor = 0;
      if(!_onEnter) {
        return;
      }
      suspend(function(resumeCallback) {
        _onEnter(text, function(text) {
          if(text) {
            _text = text;
            _cursor = _text.length;
          }
	  if(_onChange) {
            _onChange(self.getLine());
          }
          resumeCallback();
        });
      });

    }

    function cmdEnd() {
      updateCursor(_text.length);
    }

    function cmdHome() {
      updateCursor(0);
    }

    function cmdLeft() {
      if(_cursor == 0) {
        return;
      }
      updateCursor(_cursor - 1);
    }

    function cmdRight() {
      if(_cursor == _text.length) {
        return;
      }
      updateCursor(_cursor + 1);
    }

    function cmdBackwardWord() {
      if(_cursor == 0) {
        return;
      }
      updateCursor(findBeginningOfPreviousWord());
    }

    function cmdForwardWord() {
      if(_cursor == _text.length) {
        return;
      }
      updateCursor(findEndOfCurrentWord());
    }

    function cmdHistoryPrev() {
      if(!_history.hasPrev()) {
        return;
      }
      getHistory(_history.prev);
    }

    function cmdHistoryNext() {
      if(!_history.hasNext()) {
        return;
      }
      getHistory(_history.next);
    }

    function cmdHistoryTop() {
      getHistory(_history.top);
    }

    function cmdHistoryEnd() {
      getHistory(_history.end);
    }

    function cmdDeleteChar() {
      if(_text.length == 0) {
        if(_onEOT) {
          _onEOT();
          return;
        }
      }
      if(_cursor == _text.length) {
        return;
      }
      _text = remove(_text, _cursor, _cursor + 1);
      refresh();
    }

    function cmdCancel() {
      if(_onCancel) {
        _onCancel();
      }
    }

    function cmdKillToEOF() {
      _killring.append(_text.substr(_cursor));
      _text = _text.substr(0, _cursor);
      refresh();
    }

    function cmdKillWordForward() {
      if(_text.length == 0) {
        return;
      }
      if(_cursor == _text.length) {
        return;
      }
      var end = findEndOfCurrentWord();
      if(end == _text.length - 1) {
        return cmdKillToEOF();
      }
      _killring.append(_text.substring(_cursor, end))
      _text = remove(_text, _cursor, end);
      refresh();
    }

    function cmdKillWordBackward() {
      if(_cursor == 0) {
        return;
      }
      var oldCursor = _cursor;
      _cursor = findBeginningOfPreviousWord();
      _killring.prepend(_text.substring(_cursor, oldCursor));
      _text = remove(_text, _cursor, oldCursor);
      refresh();
    }

    function cmdYank() {
      var yank = _killring.yank();
      if(!yank) {
        return;
      }
      _text = insert(_text, _cursor, yank);
      updateCursor(_cursor + yank.length);
    }

    function cmdRotate() {
      var lastyanklength = _killring.lastyanklength();
      if(!lastyanklength) {
        return;
      }
      var yank = _killring.rotate();
      if(!yank) {
        return;
      }
      var oldCursor = _cursor;
      _cursor = _cursor - lastyanklength;
      _text = remove(_text, _cursor, oldCursor);
      _text = insert(_text, _cursor, yank);
      updateCursor(_cursor + yank.length);
    }

    function cmdClear() {
      if(_onClear) {
        _onClear();
      } else {
        refresh();
      }
    }

    function cmdReverseSearch() {
      if(!_inSearch) {
        _inSearch = true;
        if(_onSearchStart) {
          _onSearchStart();
        }
        if(_onSearchChange) {
          _onSearchChange({});
        }
      } else {
        if(!_searchMatch) {
          _searchMatch = {term: ''};
        }
        search();
      }
    }

    function updateCursor(position) {
      _cursor = position;
      refresh();
    }

    function addText(c) {
      _text = insert(_text, _cursor, c);
      ++_cursor;
      refresh();
    }

    function addSearchText(c) {
      if(!_searchMatch) {
        _searchMatch = {term: ''};
      }
      _searchMatch.term += c;
      search();
    }

    function search() {
      _console.log("searchtext: " + _searchMatch.term);
      var match = _history.search(_searchMatch.term);
      if(match != null) {
        _searchMatch = match;
        _console.log("match: " + match);
        if(_onSearchChange) {
          _onSearchChange(match);
        }
      }
    }

    function refresh() {
      if(_onChange) {
        _onChange(self.getLine());
      }
    }

    function getHistory(historyCall) {
      _history.update(_text);
      _text = historyCall();
      updateCursor(_text.length);
    }

    function findBeginningOfPreviousWord() {
      var position = _cursor - 1;
      if(position < 0) {
        return 0;
      }
      var word = false;
      for(var i = position; i > 0; i--) {
        var word2 = isWordChar(_text[i]);
        if(word && !word2) {
          return i + 1;
        }
        word = word2;
      }
      return 0;
    }

    function findEndOfCurrentWord() {
      if(_text.length == 0) {
        return 0;
      }
      var position = _cursor + 1;
      if(position >= _text.length) {
        return _text.length - 1;
      }
      var word = false;
      for(var i = position; i < _text.length; i++) {
        var word2 = isWordChar(_text[i]);
        if(word && !word2) {
          return i;
        }
        word = word2;
      }
      return _text.length - 1;
    }

    function isWordChar(c) {
      if(c == undefined) {
        return false;
      }
      var code = c.charCodeAt(0);
      return (code >= 48 && code <= 57)
        || (code >= 65 && code <= 90)
        || (code >= 97 && code <= 122);
    }

    function remove(text, from, to) {
      if(text.length <= 1 || text.length <= to - from) {
        return '';
      }
      if(from == 0) {

        // delete leading characters
        return text.substr(to);
      }
      var left = text.substr(0, from);
      var right = text.substr(to);
      return left + right;
    }

    function insert(text, idx, ins) {
      if(idx == 0) {
        return ins + text;
      }
      if(idx >= text.length) {
        return text + ins;
      }
      var left = text.substr(0, idx);
      var right = text.substr(idx);
      return left + ins + right;
    }

    function subscribeToKeys() {

      // set up key capture
      _element.onkeydown = function(e) {
        e = e || window.event;

        // return as unhandled if we're not active or the key is just a modifier key
        if(!_active || e.keyCode == 16 || e.keyCode == 17 || e.keyCode == 18 || e.keyCode == 91) {
          return true;
        }

        // check for some special first keys, regardless of modifiers
        _console.log("key: " + e.keyCode);
        var cmd = _keyMap['default'][e.keyCode];
        // intercept ctrl- and meta- sequences (may override the non-modifier cmd captured above
        var mod;
        if(e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
          mod = _keyMap.control[e.keyCode];
          if(mod) {
            cmd = mod;
          }
        } else if((e.altKey || e.metaKey) && !e.ctrlKey && !e.shiftKey) {
          mod = _keyMap.meta[e.keyCode];
          if(mod) {
            cmd = mod;
          }
        }
        if(!cmd) {
          return true;
        }
        queue(cmd);
        e.preventDefault();
        e.stopPropagation();
        e.cancelBubble = true;
        return false;
      };

      _element.onkeypress = function(e) {
        if(!_active) {
          return true;
        }
        var key = getKeyInfo(e);
        if(key.code == 0 || e.defaultPrevented || e.metaKey || e.altKey || e.ctrlKey) {
          return false;
        }
        queue(function cmdKeyPress() {
          if(_inSearch) {
            addSearchText(key.character);
          } else {
            addText(key.character);
          }
        });
        e.preventDefault();
        e.stopPropagation();
        e.cancelBubble = true;
        return false;
      };
    }
    if(_boundToElement) {
      self.attach(_element);
    } else {
      subscribeToKeys();
    }
    return self;
  };

    
})(this);



(function(root, $, _) {

    
    /* Shell */
  Josh.Shell = function(config) {
    config = config || {};

    // instance fields
    var _console = config.console || (Josh.Debug && root.console ? root.console : {
      log: function() {
      }
    });
    var _prompt = config.prompt || 'jsh$';
    var _shell_view_id = config.shell_view_id || 'shell-view';
    var _shell_panel_id = config.shell_panel_id || 'shell-panel';
    var _input_id = config.input_id || 'shell-cli';
    var _blinktime = config.blinktime || 500;
    var _history = config.history || new Josh.History();
    var _readline = config.readline || new Josh.ReadLine({history: _history, console: _console});
    var _active = false;
    var _cursor_visible = false;
    var _activationHandler;
    var _deactivationHandler;
    var _cmdHandlers = {
      clear: {
        exec: function(cmd, args, callback) {
          $(id(_input_id)).parent().empty();
          callback();
        }
      },
      help: {
        exec: function(cmd, args, callback) {
          callback(self.templates.help({commands: commands()}));
        }
      },
      history: {
        exec: function(cmd, args, callback) {
          if(args[0] == "-c") {
            _history.clear();
            callback();
            return;
          }
          callback(self.templates.history({items: _history.items()}));
        }
      },
      _default: {
        exec: function(cmd, args, callback) {
          callback(self.templates.bad_command({cmd: cmd}));
        },
        completion: function(cmd, arg, line, callback) {
          if(!arg) {
            arg = cmd;
          }
          return callback(self.bestMatch(arg, self.commands()))
        }
      }
    };
    var _line = {
      text: '',
      cursor: 0
    };
    var _searchMatch = '';
    var _view, _panel;
    var _promptHandler;
    var _initializationHandler;
    var _initialized;

    // public methods
    var self = {
      commands: commands,
      templates: {
        history: _.template("<div><% _.each(items, function(cmd, i) { %><div><%- i %>&nbsp;<%- cmd %></div><% }); %></div>"),
        help: _.template("<div><div><strong>Commands:</strong></div><% _.each(commands, function(cmd) { %><div>&nbsp;<%- cmd %></div><% }); %></div>"),
        bad_command: _.template('<div><strong>Unrecognized command:&nbsp;</strong><%=cmd%></div>'),
        input_cmd: _.template('<div id="<%- id %>"><span class="prompt"></span>&nbsp;<span class="input"><span class="left"/><span class="cursor"/><span class="right"/></span></div>'),
        input_search: _.template('<div id="<%- id %>">(reverse-i-search)`<span class="searchterm"></span>\':&nbsp;<span class="input"><span class="left"/><span class="cursor"/><span class="right"/></span></div>'),
        suggest: _.template("<div><% _.each(suggestions, function(suggestion) { %><div><%- suggestion %></div><% }); %></div>")
      },
      isActive: function() {
        return _readline.isActive();
      },
      activate: function() {
        if($(id(_shell_view_id)).length == 0) {
          _active = false;
          return;
        }
        _readline.activate();
      },
      deactivate: function() {
        _console.log("deactivating");
        _active = false;
        _readline.deactivate();
      },
      setCommandHandler: function(cmd, cmdHandler) {
        _cmdHandlers[cmd] = cmdHandler;
      },
      getCommandHandler: function(cmd) {
        return _cmdHandlers[cmd];
      },
      setPrompt: function(prompt) {
        _prompt = prompt;
        if(!_active) {
          return;
        }
        self.refresh();
      },
      onEOT: function(completionHandler) {
        _readline.onEOT(completionHandler);
      },
      onCancel: function(completionHandler) {
        _readline.onCancel(completionHandler);
      },
      onInitialize: function(completionHandler) {
        _initializationHandler = completionHandler;
      },
      onActivate: function(completionHandler) {
        _activationHandler = completionHandler;
      },
      onDeactivate: function(completionHandler) {
        _deactivationHandler = completionHandler;
      },
      onNewPrompt: function(completionHandler) {
        _promptHandler = completionHandler;
      },
      render: function() {
        var text = _line.text || '';
        var cursorIdx = _line.cursor || 0;
        if(_searchMatch) {
          cursorIdx = _searchMatch.cursoridx || 0;
          text = _searchMatch.text || '';
          $(id(_input_id) + ' .searchterm').text(_searchMatch.term);
        }
        var left = _.escape(text.substr(0, cursorIdx)).replace(/ /g, '&nbsp;');
        var cursor = text.substr(cursorIdx, 1);
        var right = _.escape(text.substr(cursorIdx + 1)).replace(/ /g, '&nbsp;');
        $(id(_input_id) + ' .prompt').html(_prompt);
        $(id(_input_id) + ' .input .left').html(left);
        if(!cursor) {
          $(id(_input_id) + ' .input .cursor').html('&nbsp;').css('textDecoration', 'underline');
        } else {
          $(id(_input_id) + ' .input .cursor').text(cursor).css('textDecoration', 'underline');
        }
        $(id(_input_id) + ' .input .right').html(right);
        _cursor_visible = true;
        self.scrollToBottom();
        _console.log('rendered "' + text + '" w/ cursor at ' + cursorIdx);
      },
      refresh: function() {
        $(id(_input_id)).replaceWith(self.templates.input_cmd({id:_input_id}));
        self.render();
        _console.log('refreshed ' + _input_id);

      },
      scrollToBottom: function() {
        _panel.animate({scrollTop: _view.height()}, 0);
      },
      bestMatch: function(partial, possible) {
        _console.log("bestMatch on partial '" + partial + "'");
        var result = {
          completion: null,
          suggestions: []
        };
        if(!possible || possible.length == 0) {
          return result;
        }
        var common = '';
        if(!partial) {
          if(possible.length == 1) {
            result.completion = possible[0];
            result.suggestions = possible;
            return result;
          }
          if(!_.every(possible, function(x) {
            return possible[0][0] == x[0]
          })) {
            result.suggestions = possible;
            return result;
          }
        }
        for(var i = 0; i < possible.length; i++) {
          var option = possible[i];
          if(option.slice(0, partial.length) == partial) {
            result.suggestions.push(option);
            if(!common) {
              common = option;
              _console.log("initial common:" + common);
            } else if(option.slice(0, common.length) != common) {
              _console.log("find common stem for '" + common + "' and '" + option + "'");
              var j = partial.length;
              while(j < common.length && j < option.length) {
                if(common[j] != option[j]) {
                  common = common.substr(0, j);
                  break;
                }
                j++;
              }
            }
          }
        }
        result.completion = common.substr(partial.length);
        return result;
      }
    };

    function id(id) {
      return "#"+id;
    }

    function commands() {
      return _.chain(_cmdHandlers).keys().filter(function(x) {
        return x[0] != "_"
      }).value();
    }

    function blinkCursor() {
      if(!_active) {
        return;
      }
      root.setTimeout(function() {
        if(!_active) {
          return;
        }
        _cursor_visible = !_cursor_visible;
        if(_cursor_visible) {
          $(id(_input_id) + ' .input .cursor').css('textDecoration', 'underline');
        } else {
          $(id(_input_id) + ' .input .cursor').css('textDecoration', '');
        }
        blinkCursor();
      }, _blinktime);
    }

    function split(str) {
      return _.filter(str.split(/\s+/), function(x) {
        return x;
      });
    }

    function getHandler(cmd) {
      return _cmdHandlers[cmd] || _cmdHandlers._default;
    }

    function renderOutput(output, callback) {
      if(output) {
        $(id(_input_id)).after(output);
      }
      $(id(_input_id) + ' .input .cursor').css('textDecoration', '');
      $(id(_input_id)).removeAttr('id');
      $(id(_shell_view_id)).append(self.templates.input_cmd({id:_input_id}));
      if(_promptHandler) {
        return _promptHandler(function(prompt) {
          self.setPrompt(prompt);
          return callback();
        });
      }
      return callback();
    }

    function activate() {
      _console.log("activating shell");
      if(!_view) {
        _view = $(id(_shell_view_id));
      }
      if(!_panel) {
        _panel = $(id(_shell_panel_id));
      }
      if($(id(_input_id)).length == 0) {
        _view.append(self.templates.input_cmd({id:_input_id}));
      }
      self.refresh();
      _active = true;
      blinkCursor();
      if(_promptHandler) {
        _promptHandler(function(prompt) {
          self.setPrompt(prompt);
        })
      }
      if(_activationHandler) {
        _activationHandler();
      }
    }

    // init
    _readline.onActivate(function() {
      if(!_initialized) {
        _initialized = true;
        if(_initializationHandler) {
          return _initializationHandler(activate);
        }
      }
      return activate();
    });
    _readline.onDeactivate(function() {
      if(_deactivationHandler) {
        _deactivationHandler();
      }
    });
    _readline.onChange(function(line) {
      _line = line;
      self.render();
    });
    _readline.onClear(function() {
      _cmdHandlers.clear.exec(null, null, function() {
        renderOutput(null, function() {
        });
      });
    });
    _readline.onSearchStart(function() {
      $(id(_input_id)).replaceWith(self.templates.input_search({id:_input_id}));
      _console.log('started search');
    });
    _readline.onSearchEnd(function() {
      $(id(_input_id)).replaceWith(self.templates.input_cmd({id:_input_id}));
      _searchMatch = null;
      self.render();
      _console.log("ended search");
    });
    _readline.onSearchChange(function(match) {
      _searchMatch = match;
      self.render();
    });
    _readline.onEnter(function(cmdtext, callback) {
      _console.log("got command: " + cmdtext);
      var parts = split(cmdtext);
      var cmd = parts[0];
      var args = parts.slice(1);
      var handler = getHandler(cmd);
      return handler.exec(cmd, args, function(output, cmdtext) {
        renderOutput(output, function() {
          callback(cmdtext)
        });
      });
    });
    _readline.onCompletion(function(line, callback) {
      if(!line) {
        return callback();
      }
      var text = line.text.substr(0, line.cursor);
      var parts = split(text);

      var cmd = parts.shift() || '';
      var arg = parts.pop() || '';
      _console.log("getting completion handler for " + cmd);
      var handler = getHandler(cmd);
      if(handler != _cmdHandlers._default && cmd && cmd == text) {

        _console.log("valid cmd, no args: append space");
        // the text to complete is just a valid command, append a space
        return callback(' ');
      }
      if(!handler.completion) {
        // handler has no completion function, so we can't complete
        return callback();
      }
      _console.log("calling completion handler for " + cmd);
      return handler.completion(cmd, arg, line, function(match) {
        _console.log("completion: " + JSON.stringify(match));
        if(!match) {
          return callback();
        }
        if(match.suggestions && match.suggestions.length > 1) {
          return renderOutput(self.templates.suggest({suggestions: match.suggestions}), function() {
            callback(match.completion);
          });
        }
        return callback(match.completion);
      });
    });
    return self;
  }



    /* Path Handler */
      Josh.PathHandler = function(shell, config) {
    config = config || {};
    var _console = config.console || (Josh.Debug && root.console ? root.console : {
      log: function() {
      }
    });
    var _shell = shell;
    _shell.templates.not_found = _.template("<div><%=cmd%>: <%=path%>: No such file or directory</div>");
    _shell.templates.ls = _.template("<div><% _.each(nodes, function(node) { %><span><%=node.name%>&nbsp;</span><% }); %></div>");
    _shell.templates.pwd = _.template("<div><%=node.path %>&nbsp;</div>");
    _shell.templates.prompt = _.template("<%= node.path %> $");
    var _original_default = _shell.getCommandHandler('_default');
    var self = {
      current: null,
      pathCompletionHandler: pathCompletionHandler,
      commandAndPathCompletionHandler: commandAndPathCompletionHandler,
      getNode: function(path, callback) {
        callback();
      },
      getChildNodes: function(node, callback) {
        callback([]);
      },
      getPrompt: function() {
        return _shell.templates.prompt({node: self.current});
      }
    };

    _shell.setCommandHandler("ls", {
      exec: ls,
      completion: pathCompletionHandler
    });
    _shell.setCommandHandler("pwd", {
      exec: pwd,
      completion: pathCompletionHandler
    });
    _shell.setCommandHandler("cd", {
      exec: cd,
      completion: pathCompletionHandler
    });
    _shell.setCommandHandler("_default", {
      exec: _original_default.exec,
      completion: commandAndPathCompletionHandler
    });
    _shell.onNewPrompt(function(callback) {
      callback(self.getPrompt());
    });

    function commandAndPathCompletionHandler(cmd, arg, line, callback) {
      _console.log("calling command and path completion handler w/ cmd: '"+cmd+"', arg: '"+arg+"'");
      if(!arg) {
        arg = cmd;
      }
      if(arg[0] == '.' || arg[0] == '/') {
        return pathCompletionHandler(cmd, arg, line, callback);
      }
      return _original_default.completion(cmd, arg, line, callback);
    }

    function pathCompletionHandler(cmd, arg, line, callback) {
      _console.log("completing '" + arg + "'");
      if(!arg) {
        _console.log("completing on current");
        return completeChildren(self.current, '', callback);
      }
      if(arg[arg.length - 1] == '/') {
        _console.log("completing children w/o partial");
        return self.getNode(arg, function(node) {
          if(!node) {
            _console.log("no node for path");
            return callback();
          }
          return completeChildren(node, '', callback);
        });
      }
      var partial = "";
      var lastPathSeparator = arg.lastIndexOf("/");
      var parent = arg.substr(0, lastPathSeparator + 1);
      partial = arg.substr(lastPathSeparator + 1);
      if(partial === '..' || partial === '.') {
        return callback({
          completion: '/',
          suggestions: []
        });
      }
      _console.log("completing children via parent '" + parent+"'  w/ partial '"+partial+"'");
      return self.getNode(parent, function(node) {
        if(!node) {
          _console.log("no node for parent path");
          return callback();
        }
        return completeChildren(node, partial, function(completion) {
          if(completion && completion.completion == '' && completion.suggestions.length == 1) {
            return callback({
              completion: '/',
              suggestions: []
            });
          }
          return callback(completion);
        });
      });
    }

    function completeChildren(node, partial, callback) {
      self.getChildNodes(node, function(childNodes) {
        callback(_shell.bestMatch(partial, _.map(childNodes, function(x) {
          return x.name;
        })));
      });
    }

    function cd(cmd, args, callback) {
      self.getNode(args[0], function(node) {
        if(!node) {
          return callback(_shell.templates.not_found({cmd: 'cd', path: args[0]}));
        }
        self.current = node;
        return callback();
      });
    }

    function pwd(cmd, args, callback) {
      callback(_shell.templates.pwd({node: self.current}));
    }

    function ls(cmd, args, callback) {
      _console.log('ls');
      if(!args || !args[0]) {
        return render_ls(self.current, self.current.path, callback);
      }
      return self.getNode(args[0], function(node) {
        render_ls(node, args[0], callback);
      });
    }

    function render_ls(node, path, callback) {
      if(!node) {
        return callback(_shell.templates.not_found({cmd: 'ls', path: path}));
      }
      return self.getChildNodes(node, function(children) {
        _console.log("finish render: " + node.name);
        callback(_shell.templates.ls({nodes: children}));
      });
    }

    return self;
      };





    /* Input */
    (function (root, $, _) {
  $.fn.josh_caretTo = function (index) {
    return this.queue(function (next) {
      if (this.createTextRange) {
        var range = this.createTextRange();
        range.move("character", index);
        range.select();
    } else if (this.selectionStart !== null) {
        this.setSelectionRange(index, index);
      }
      next();
    });
  };
  $.fn.josh_caretPosition = function () {
    var el = this.get(0);
    if (el.createTextRange) {
      var range = el.createTextRange();
      range.moveStart('character', -el.value.length);
      return range.text.length;
  } else if (el.selectionStart !== null) {
      return el.selectionStart;
    }
    return 0;
  };

  var history = Josh.History();
  var killring = new Josh.KillRing();

  Josh.Input = function (config) {
    config = config || {};

    // instance fields
    var _console = config.console || (Josh.Debug && root.console ? root.console : {
      log: function () {
      }
    });

    var _id = "#" + config.id;
    var _blinktime = config.blinktime || 500;
    var _active = false;
    var _cursor_visible = false;
    var _isInput = false;
    var _history = config.history || history;
    var _killring = config.killring || killring;
    var _text;
    var self = {
      templates: {
        span: _.template('<span class="input"><span class="left"/><span class="cursor"/><span class="right"/></span>')
      },
      history: _history,
      killring: _killring
    };

    $(document).ready(function () {
      var $input = $(_id);
      var el = $input.get(0);
      var readline = new Josh.ReadLine({
        history: _history,
        killring: _killring,
        console: _console
      });
      self.readline = readline;
      readline.attach(el);
      var activate = null;
      _isInput = $input.is('input');
      if (_isInput) {

        _console.log(_id + ' is an input');

        function renderInput(line) {
          var text = line ? line.text : '';
          _text = text;
          $input.val(text);
          $input.josh_caretTo(line.cursor);
        }
        readline.onChange(renderInput);
        $input.click(function() {
          var line = readline.getLine();
          line.cursor = $input.josh_caretPosition();
          readline.setLine(line);
        });

        activate = function() {
          // Note: have to re-render with a setTimeout, because on focus, but after the onfocus event is processed,
          // the input will select all, invalidating our render
          setTimeout(function() {
            renderInput(readline.getLine());
          }, 0);
        };
      } else {
        _console.log(_id + ' is a non-input element');
        $input.html(self.templates.span());
        if(typeof $input.attr('tabindex') === 'undefined') {
          $input.attr('tabindex',0);
        }
        var $left = $input.find('.left');
        var $right = $input.find('.right');
        var $cursor = $input.find('.cursor');

        function renderSpan(line) {
          var text = line.text || '';
          _text = text;
          var cursorIdx = line.cursor || 0;
          var left = _.escape(text.substr(0, cursorIdx)).replace(/ /g, '&nbsp;');
          var cursor = text.substr(cursorIdx, 1);
          var right = _.escape(text.substr(cursorIdx + 1)).replace(/ /g, '&nbsp;');
          $left.html(left);
          if (!cursor) {
            $cursor.html('&nbsp;').css('textDecoration', 'underline');
          } else {
            $cursor.text(cursor).css('textDecoration', 'underline');
          }
          $right.html(right);
        }

        function blinkCursor() {
          if (!_active) {
            return;
          }
          root.setTimeout(function () {
            if (!_active) {
              return;
            }
            _cursor_visible = !_cursor_visible;
            if (_cursor_visible) {
              $cursor.css('textDecoration', 'underline');
            } else {
              $cursor.css('textDecoration', '');
            }
            blinkCursor();
          }, _blinktime);
        }

        activate = function () {
          blinkCursor();
        }
        readline.onChange(renderSpan);
      }
      readline.unbind({keyCode: Josh.Keys.Special.Tab});
      readline.unbind({'char': 'R', ctrlKey: true});
      readline.onActivate(function () {
        _active = true;
        activate();
      });
      readline.onDeactivate(function () {
        _active = false;
        if (_text) {
          _history.accept(_text);
        }
      });

    });
    return self;
  }


    
})(this, $, _);



/* Initialize */
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
