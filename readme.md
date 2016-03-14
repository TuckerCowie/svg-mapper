# SVG Mapper

> A simple svg parser that maps bulk svg data into a single .json output

## Installation

Clone the repo then run the following command to install dependencies:

```bash
npm install
```

## Usage

### Input

To run the mapper on a specific directory, pass it as the first argument when running the application:

```bash
node index.js {input-dir}
```

### Output

When you want to output the `svgs.json` file to a specific location, you must pass an input as the first argument:

```bash
node idnex.js {input-dir} {output-dir}
```