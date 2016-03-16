const fs = require('fs');
const path = require('path');
const recursive = require('recursive-readdir');
const _ = require('lodash');

/**
 * Parses a folder directory recursively to find embeded `svg` elements and maps those elements into
 * `svgs.json` for programmatic consumption.
 * @param {string} Input Directory - file path to be parsed recursively
 * @param {string} Output Directory - file path to output `svgs.js`
 */
function init(input, output, cb) {
  recursive(input, [ignore], (err, files) => {
    if (err) {
      console.log(err);
      return;
    }
    const categories = _
      .chain(files)
      // Creates inital files array to iterate over
      .map(getIconsMeta(input))
      // Extracts SVG information using Regex
      .map(getSvgData(input))
      // Group by enclosing folder
      .groupBy('category')
      // Maps each icon object to its category by name
      .mapValues((category) => _.keyBy(category, 'name'))
      // Pop the result
      .value();
    result = JSON.stringify({categories}, null, '\t');
    fs.writeFile(output, result, 'utf8', cb);
  });
}

init((process.argv[2] || process.cwd()), path.resolve(process.argv[3] || process.cwd(), 'svgs.json'));

/**
 * Returns true for every file or folder that should be ignored
 * @param {String} file - A file path to check
 * @param {Object} stats - An fs.stats object of the first argument
 * @returns {Bool} whether or not the passed file should be ignored
 */
function ignore(file, stats) {
  return [
    path.basename(file) === 'node_modules',
    !stats.isDirectory() && path.extname(file) !== '.js' && path.extname(file) !== '.jsx'
  ].indexOf(true) > -1;
}

/**
 * Maps an array of file paths into JSON objects containing file meta
 * @param {Array} files - an array of file paths
 * @returns {Object}
 */
function getIconsMeta(input) {
  return (file) => ({
    file: path.relative(input, file),
    name: path.basename(file, path.extname(file)),
    category: path.dirname(file).split('/').pop()
  });
}

/**
 * Finds all `key="value"` pairs from a string and maps them into an array
 * @param {String} attributes - XML formatted element string
 * @returns {Array}
 */
function getAttrsArray(attributes) {
  return attributes.match(/(\S+)=['"](.*?)['"]/g).map(attr => ({
      attribute: attr.match(/[^"\W]+/g)[0],
      value: attr.match(/[^"\W]+/g)[1]
  }));
}

/**
 * Functor that takes an input path and returns a mapping function
 * @param {String} input - File path to a file to parse for matching elements
 * @returns {Function}
 */
function getSvgData(input) {
  /**
   * Parses a file for matching SVG `path` and `circle` Elements
   * @param {Object} iconMeta - An object containing a relative file path at key `file`
   * @returns {Array} Objects containing any matching path or circle data
   */
  return (iconMeta) => {
    const svgRegEx = /(path|circle){1}((?:\W(?:\S+)=['"](?:.*?)['"])+)/g;
    const matches = fs.readFileSync(path.resolve(input, iconMeta.file), 'utf8').match(svgRegEx) || [];
    return _.set(iconMeta, 'elements', matches.map(element => ({
      type: element.split(' ')[0],
      attrs: getAttrsArray(element)
    })));
  };
}
