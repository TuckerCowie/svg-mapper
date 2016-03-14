const fs = require('fs');
const path = require('path');
const recursive = require('recursive-readdir');
const _ = require('lodash');

const input = process.argv[2] || process.cwd();
const output = path.resolve(process.argv[3] || process.cwd(), 'svgs.json');

// Runs a RegEx on a file and returns an array of objects containing the element
function getSvgData(file) {
  var svgData = [];
  // Currently only supports `path` elements
  const svgRegEx = /(path|circle)*(?:\W(?:(cx|cy|r|d)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?))+/g;
  const contents = fs.readFileSync(file, 'utf8');
  var matches;
  while ((matches = svgRegEx.exec(contents)) !== null) {
    var attrs = {};
    attrs[matches[2]] = matches[3];
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

  fs.writeFile(output, JSON.stringify(result, null), 'utf8');
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
