var assert = require('assert');
var minimake = require('../index.js');
var core = require('../core.js');

describe('minimake', function() {
  it('Should do something', function(done) {
    var env = new core.Env('test');

    var inFilename = '/tmp/file.txt';
    var outFilename = '/tmp/file2.txt';
    
    var inFile = env.makeFileTarget(inFilename);

    done();
  });
});
