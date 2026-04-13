// Release flow:
//   npm version patch        # bumps package.json, runs this script, commits all 3 version files, tags 1.0.1
//   git push && git push --tags  # triggers .github/workflows/release.yml

import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.env.npm_package_version;

// read minAppVersion from manifest.json and bump version to target version
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

// update versions.json with target version and minAppVersion from manifest.json
// Guard checks the version KEY so patch bumps that share the same minAppVersion still
// get recorded. (The official sample plugin checks values instead of keys, which skips
// entries when minAppVersion does not change between patch bumps.)
const versions = JSON.parse(readFileSync("versions.json", "utf8"));
if (!versions[targetVersion]) {
	versions[targetVersion] = minAppVersion;
	writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
}
