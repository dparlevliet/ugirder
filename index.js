String.prototype.format = function() {
  var args = arguments;
  return this.replace(/{(\d+)}/g, (match, number) => {
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
    ;
  });
};

module.exports = (function() {
  var self = this;

  self.Q = require('q');
  self.colors = require('colors');

  self._moment = require('moment-timezone');
  self.moment = function() {
    return self._moment.apply(null, arguments).tz('Europe/London');
  };

  self.math = require('mathjs');

  self.lastLogIndent = 0;

  self.log = (message, color, indent, ignore_indent_storage) => {
    if (!color) {
      color = self.colors.grey;
    }
    var indent_str = '';

    if (!indent) {
      indent = 0;
    } else if (self.lastLogIndent + 1 < indent && !ignore_indent_storage) {
      indent = self.lastLogIndent + 1;
      ignore_indent_storage = true;
    }

    for (var x = 0; x<indent; x++) {
      indent_str += '  ';
    }

    if (!ignore_indent_storage) {
      self.lastLogIndent = indent;
    }
    console.log(color('[ ' + self.moment().format('MMMM Do YYYY, h:mm:ss a') + ' ] {0}{1}'.format(indent_str, message)));
  };

  self.time = (f) => {
    var start = (new Date()).getTime();
    return self.defer((deferred) => {
      f(deferred);
    }).then(() => {
      var now = (new Date()).getTime();
      self.log('Total time {0}ms'.format(now-start), undefined, self.lastLogIndent+1);
    });
  };

  self.reduce = (arrList, callback) => {
    return self.defer((deferred) => {
      arrList.reduce(
        (previous, value, offset) => {
          return previous.then(function() {
            return self.defer(function(deferred) {
              callback(value, offset, deferred);
            });
          });
        },
        self.defer(
          (deferred) => {
            deferred.resolve();
          }
        )
      ).then(() => {
        deferred.resolve();
      }).fail((err) => {
        console.log(err);
        deferred.resolve();
      });
    });
  };

  self.defer = (f) => {
    var deferred = self.Q.defer();
    f(deferred);
    return deferred.promise;
  };

  self.toSatoshi = (value) => {
    return self.math.round(value, 8);
  };

  self.totalSatoshi = (v1, v2) => {
    return self.toSatoshi(self.toSatoshi(v1) * self.toSatoshi(v2));
  };

  self.pctDiff = (v1, v2) => {
    return self.math.round(((v1 - v2) / v1) * 100, 2);
  };

  return self;
}());