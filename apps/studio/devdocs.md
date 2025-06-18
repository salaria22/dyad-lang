# Development
## Installation
1. `git clone` this repository
2. log in to GitHub's npm registry with
    ```
    npm login --scope=@juliacomputing --auth-type=legacy --registry=https://npm.pkg.github.com
    ```
    and provide your username and a PAT that has the `read:packages` scope (see the [documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-with-a-personal-access-token) for more details)
3. `npm ci` to install all dependencies

## Running

Open this directory in VS Code and then select the "Run and Debug" (Shift-Cmd-D on a Mac) sidebar. At the top you just need to select "Run Extension" and press the "Play" button.

## Debugging

There is something odd with debugging the server. The client code seems fine but for the server I sometimes have difficulty setting breakpoints. It seems like one approach is to set break points in the `out/...` code. The source maps are on so when it stops, it stops in the right TypeScript file. But it seems very unreliable and the order of attaching the server, triggering the code, setting the breakpoints, etc. all seems kind of flimsy. I need to do more trial and error.

## Using new versions

You will have to run `Restart Extension Host` and `Reload Window` to completely reset the extension.