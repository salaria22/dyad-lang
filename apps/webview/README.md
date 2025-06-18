# Building

Normally, when you run the extension the `launch.json` file in `../.vscode` will
perform a build of the web view. But if you are actually developing the
webview, you want it to be continuously updated. Normally, that would mean
running the `vite` dev server. While it is possible to recognize when the
extension is being debugged and to load styles and scripts from a different Uri,
the problem is that the `vite` dev server currently reports the content type of
`build/assets/index.js` and `text/html` and this is a Content Security Policy
problem. _sigh_

So, the best workaround I could find was to run `npm run build:watch` in this
directory. That will continuously rebuild the source code for the web view.
