# Syntax Highlighting

This is a textMate grammar description which is usable by not only VS Code but
also `sli.dev`. But one of the things that is not very well documented is that
scopes are common used (_i.e.,_ will get nicely colored by themes) and how to
determine what scopes are getting applied.

The following page does a nice job of listing some common scopes:

https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide

In addition, the `Developer: Inspect Editor Tokens and Scopes` is extremely
valuable in debugging scopes (and figuring out what scope various _other_
extensions are associating with ranges of text).
