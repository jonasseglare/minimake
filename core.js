var fs = require('fs');
// https://www.npmjs.com/package/object-hash

function Env(name) {
  this.buildDirectory = process.cwd();
  this.name = name;
  this.targetDatabase = {};
}

function isString(x) {
  return typeof x == 'string';
}

function makeGetAge(spec) {
  if (isString(spec.sourceFile)) {
    return function(cb) {
      fs.stat(spec.sourceFile, function(err, data) {
        if (err) {
          cb(err);
        } else {
          cb(null, data.mtime);
        }
      });
    };
  }
  throw new Error('Unable to generate age-getter');
}

function getName(spec) {
  console.log('Spec: %j', spec);
  if (isString(spec.name)) {
    return spec.name;
  }
  throw new Error('No name in target spec');
}

function Target(env, deps, spec) {
  this.deps = deps;
  this.spec = spec;
  this.name = getName(spec);
  this.ageGetter = makeGetAge(spec);
}

Target.prototype.getAge = function(cb) {
  if (this.age) {
    cb(null, age);
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

Env.prototype.makeFileTarget = function(filename) {
  return this.makeTarget([], {
    name: 'FileTarget_' + filename,
    sourceFile: filename
  });
}

module.exports.Env = Env;
