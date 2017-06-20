'use strict';

const fs = require('fs');
const path = require('path');

const _getHandler = function(ctrl, handler) {
  if (typeof(handler) == 'function') {
    return handler
  } else if(typeof(handler) == 'string' && typeof(ctrl[handler]) == 'function') {
    return ctrl[handler];
  } else if(handler instanceof Array) {
    let handlers = [];
    for(let i in handler) {
      let h = _getHandler(ctrl, handler[i]);
      if(h) {
        handlers = handlers.concat(h);
      }
    }
    if(handlers.length) {
      return handlers;
    }
  }
  
  return null;
}

const _injectController = function(router, filepath) {
  try {
    let ctrl = require(filepath);
    if (ctrl.routes) {
      for (let route in ctrl.routes) {
        let methods = ctrl.routes[route];
        for (let method in methods) {
          let handler = _getHandler(ctrl, methods[method]);
          handler && router[method](route, handler);
        }
      }
    }
  } catch(e) {
    console.log(filepath, e.stack);
  }
}

module.exports = {
  inject: function(router, dir, options) {
    let verbose = options ? options.verbose : null;
    let filter = (options && options.filter) ? options.filter : function(file) {
      return file.indexOf('.') !== 0;
    }
    if(fs.lstatSync(dir).isFile()) {
      verbose && console.log('\n   %s:', file);
      _injectController(router, dir);
    } else {
      fs.readdirSync(dir)
        .filter(filter)
        .sort()
        .forEach(function(file) {
          verbose && console.log('\n   %s:', file);
          _injectController(router, path.join(dir, file));
        });
    }
    
    return router;
  }
}