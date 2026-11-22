const fs = require('fs');

exports.default = async function (buildResult) {
  for (const p of buildResult.artifactPaths || []) {
    if (p.includes('-macOS-x64.')) {
      const next = p.replace('-macOS-x64.', '-macOS-intel-x64.');
      if (fs.existsSync(p)) {
        fs.renameSync(p, next);
      }
    }
  }
  return [];
};
