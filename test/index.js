var assert = require('assert');
var minimake = require('../index.js');
var core = require('../core.js');
var fs = require('fs');

describe('minimake', function() {
  it('Should do something', function(done) {
    var env = new core.Env('test');

    var inFilename = '/tmp/file.txt';
    var outFilename = '/tmp/file2.txt';
    
    var inFile = env.makeFileTarget(inFilename);
    fs.writeFile(inFilename, 'mjao', function(err) {
      assert(!err);
      inFile.getAge(function(err, age) {
        assert(!err);
        assert(err == null);
        assert(age);
        inFile.getAge(function(err, age2) {
          assert(age == age2);
          done(err);
        });
      });
    });
  });
});
