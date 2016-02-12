var assert = require('assert');
var snytbagge = require('../snytbagge/index.js');
var fs = require('fs');
var path = require('path');
// https://www.npmjs.com/package/object-hash

function Env(name) {
  this.buildDirectory = process.cwd();
  this.name = name;

  // Used to keep track of target ages across different builds.
  // Not needed, because the age should be deducible from the files involved.
  // this.targetDatabase = {};
}

function isTarget(x) {
  return x instanceof Target;
}

function isString(x) {
  return typeof x == 'string';
}

function isArray(x) {
  return x instanceof Array;
}

function isFunction(x) {
  return typeof x == 'function';
}

function getSingleElement(x) {
  if (x instanceof Array) {
    assert(x.length == 1);
    return x[0];
  }
  return x;
}

function makeAgeGetterFromDstFiles(dstFiles) {
  return function(cb) {
    //cb(null, 'mjaoe'); return;

    var args = new snytbagge.ArgArray(dstFiles.length);
    for (var i = 0; i < dstFiles.length; i++) {
      var cb2 = args.makeSetter(i);
      fs.stat(dstFiles[i], function(err, data) {
        if (err) {
          cb2(err);
        } else {
          cb2(null, data.mtime);
        }
      });
    }
    args.get(function(err, ages) {
      if (err) {
        cb(err);
      } else {
        var minAge = ages[0];
        for (var i = 1; i < ages.length; i++) {
          var age = ages[i];
          if (age < minAge) {
            minAge = age;
          }
        }
        cb(null, minAge);
      }
    });
  };
}


function makeAgeGetter(spec) {
  if (isFunction(spec.getAge)) {
    return spec.getAge;
  } else if (isArray(spec.dstFiles) && spec.dstFiles.length > 0) {
    return makeAgeGetterFromDstFiles(spec.dstFiles);
  }
  throw new Error('Unable to generate age-getter');
}


function getName(spec) {
  if (isString(spec.name)) {
    return spec.name;
  }
  throw new Error('No name in target spec');
}

function Target(env, deps, spec) {
  this.deps = deps;
  this.spec = spec;
  this.name = getName(spec);
  this.ageGetter = makeAgeGetter(spec);

  this.buildState = 0; // 0: Not built, 1: In progress: 2: Completed

  // Once buildState = 2, these two may be defined.
  this.buildError = null; 
  this.buildOutput = null;
}

Target.prototype.getAge = function(cb) {
  if (this.age) {
    cb(null, this.age);
  } else {
    var self = this;
    this.ageGetter(function(err, age) {
      if (err) {
        cb(err);
      } else {
        self.age = age;
        cb(null, age);
      }
    });
  }
}

Env.prototype.makeTarget = function(dependencies, spec) {
  return new Target(this, dependencies, spec);
};

Env.prototype.file = function(filename) { // Identity: The output is the input.
  return this.makeTarget([], {
    name: 'FileTarget_' + filename,
    srcFiles: [filename],
    dstFiles: [filename]
  });
}

function getFirstDstFilename(x) {
  assert(isTarget(x));
  if (isArray(x.spec.dstFiles)) {
    return x.spec.dstFiles[0];
  }
  return null;
}


function extendFilename(f) {
  var p = path.parse(f);
  return path.join(p.dir, p.name + "_transformed" + p.ext);
}

// TODO: Generate it in the build directory instead of the source 
// directory.
function generateTransformedFilename(srcTarget) {
  var f = getFirstDstFilename(srcTarget);
  if (f) {
    return extendFilename(f, "_transformed");
  }
  return null;
}

Env.prototype.transformFile = function(deps, transformer) {
  var x = getSingleElement(deps);
  var dstFilename = generateTransformedFilename(x);
  return this.makeTarget([x], {
    name: "transform_" + x,
    srcFiles: [],
    dstFiles: [dstFilename]
  });
}

module.exports.Env = Env;
