const execSync = require('child_process').execSync
const arg = process.argv[2] ? ' ' + process.argv[2] : ''
execSync('yarn chokidar build __tests -c \"yarn test' + arg + '\" ', {stdio:[0, 1, 2]})
