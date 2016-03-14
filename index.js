const fs = require('fs');
const path = require('path');
const recursive = require('recursive-readdir');
const _ = require('lodash');

const input = process.argv[2] || process.cwd();

// Runs a RegEx on a file and returns an array of objects containing the element
function getSvgData(file) {
  var svgData = [];
  // Currently only supports `path` elements
  const svgRegEx = /(path)*(?:\W(?:(d)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?))+/g;
  var matches;
  while ((matches = svgRegEx.exec(fs.readFileSync(file, 'utf8'))) !== null) {
    svgData.push({element: matches[1], attr: matches[2], value: matches[3]});
  }
  if (svgData.length < 0) {
    console.warn('Cannot get SVG Data from ' + file);
    return;
  }
  return svgData;
}

// Aggregates files into simple .JSON objects
function creatIconObjects(files) {
  return files.map((file) => ({
    file: path.relative(input, file),
    name: path.basename(file, path.extname(file)),
    category: path.dirname(file).split('/').pop(),
    data: getSvgData(file)
  })).filter((f) => f.data);
}

// Groups icons by category, then maps them by name
function createCategories(fileObjects) {
  const categories = _.groupBy(fileObjects, 'category');
  var categoriesByIcon = {};
  // We can't use .map here because we need an object
  _.forEach(categories, (category, name) => {
    categoriesByIcon[name] = _.keyBy(category, 'name');
  });
  return categoriesByIcon;
}

// Accumulates created icons and arrays into `svgs.json`
function accumulate(err, files) {
  if (err) {
    console.log(err);
    return;
  }
  const result = {
    categories: createCategories(creatIconObjects(files))
  };

  fs.writeFile('svgs.json', JSON.stringify(result, null, '\t'), 'utf8');
}

// Returns true for every file or folder that meets the following coniditions
function ignore(file, stats) {
  return [
    path.basename(file) === 'node_modules',
    !stats.isDirectory() && path.extname(file) !== '.js' && path.extname(file) !== '.jsx'
  ].indexOf(true) > -1;
}

// Gets all relevant files
recursive(input, [ignore], accumulate);
