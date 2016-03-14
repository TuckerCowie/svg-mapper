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
      .map(getSvgData)
      // Remove meta without any Svg Data
      .filter('data')
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

// Runs a RegEx on a file and returns an array of objects containing the element
function getSvgData(file) {
  var svgData = [];
  // Currently only supports `path` elements
  const svgRegEx = /(path|circle)*(?:\W(?:(cx|cy|r|d)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?))+/g;
  var matches;
  while ((matches = svgRegEx.exec(contents)) !== null) {
    var attrs = {};
    if (matches[1] === 'path') {
      attrs[matches[2]] = matches[3];
    } else if (matches[1] === 'circle') {
      const circleElementRegEx = /(?:\W(?:(cx|cy|r)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?))+/g;
      const circleAttrs = matches[0];
      var circleMatches;
      while(circleMatches = circleElementRegEx.exec(circleAttrs) !== null) {
        console.log(circleAttrs);
      }
    }
    svgData.push({
      element: matches[1],
      attrs,
    });
  }
  if (svgData.length < 0) {
    console.warn('Cannot get SVG Data from ' + file);
    return;
  } else if (_.some(svgData, ['element', 'circle'])) {
    console.warn(file + ' contains circle elements and is not included in the output');
    return;
  }
  return svgData;
}
