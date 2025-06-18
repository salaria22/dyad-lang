# Overview

This is a CLI for the Dyad tool chain. It provides a script that can take Dyad
code found in a Julia package and generate the Julia code associated with those
Dyad models in the same Julia package.

It does this by building on top of the
[`dyad-kernel`](https://github.com/JuliaComputing/dyad-lang) compilation
framework (which is designed to run both in a Node and browser environment) and
adding a CLI script and access to a desktop file system via Node's `fs` package.

In order to download any of the dependencies here, you'll need to follow the
instructions [here](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-with-a-personal-access-token). The resulting `.npmrc` file should be placed in `$HOME/.npmrc`.

## Getting started

Ensure you have Node.js version 20 or later installed. Download it from [https://nodejs.org/en/download](https://nodejs.org/en/download).

To log in to the GitHub npm package registry, run the following command:

```shell
npm login --scope=@juliacomputing --auth-type=legacy --registry=https://npm.pkg.github.com
```

Notes:

- Enter your GitHub username in lowercase when prompted.
- Provide a "classic" personal access token, with the `read:packages` scope, when prompted for a password. See [these instructions](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) on how to create one.

Install the dependencies and build the package

```shell
npm install
npm run build
```

You can now run the dyad-cli locally using the following command:

```shell
node dist/scripts/entry.js
```

To view available commands and arguments, run:

```shell
node dist/scripts/entry.js --help
```

## Profiling

To profile the Dyad compiler, you can use the `npm run profile` command. This
will generate a directory with a `.0x` suffix in this directory. For example,
to profile the compiler on compiling a package, use:

```
$ npm run profile -- compile <directory>
```
