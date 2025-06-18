---
order: 100
icon: play-24
---

# Startup

This section covers how the application might be launched and the various paths
the user may take to the running Dyad GUI.

<div style="text-align: center">

```mermaid
---
title: GUI Launch Flow
---
flowchart TB
  juliahub[Started from JuliaHub]
  style juliahub fill:#cfc

  link[Started from a Deep Link]
  style link fill:#ffc

  open[Dyad GUI Opened]
  style open fill:#cfc

  prompt[Existing/New Project]
  style prompt fill:#fcc

  new[Create New Project]
  style new fill:#fcc

  juliahub --> prompt
  prompt --> |Select Existing Project| open
  prompt --> |Select New Project|new
  new --> |Choose Project Name|open
  link --> |Initialize Application State from Link|open
  open --> |Close| prompt

```

</div>

Once the application reaches the ["Dyad GUI Opened"](./OPENED.md) stage, the application is
running and there is a current project specified.
