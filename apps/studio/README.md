# Dyad Studio

Dyad Studio is a VSCode extension for the Dyad language.

Dyad is our next-generation platform for model-based design. Using modern
scientific machine learning (SciML) techniques and equation-based digital twin
modeling and simulation, Dyad encompasses block diagrams, acausal modeling, and
a differentiable programming language all within a single environment. Dyad also
gives you access to the Julia language and its large scientific and numerical
ecosystem while leveraging the power of our native Julia linear, non-linear and
differential equation solvers as well as symbolic manipulation capabilities all
optimized and compiled for the users target hardware.

The Dyad Studio extension allows users to create and develop Dyad libraries and
then compile them to Julia code. To run the Julia code, you will need [the Julia
programming language installed on your
computer](https://julialang.org/install/), and you will need to [authenticate
with a
JuliaHub account](https://juliahub.com/ui)
to download the proprietary Dyad software.

## Requirements

You will need to perform some setup before you can use Dyad Studio
locally:

- Create a JuliaHub account ([sign up here](https://juliahub.com/index.html))
- Install the Julia programming language ([see instructions
  here](https://julialang.org/install/))
- Install the [Dyad
  Studio](https://marketplace.visualstudio.com/items?itemName=JuliaComputing.dyad-studio)
  extension in VSCode. This will also install the JuliaHub and Julia language
  extensions automatically, which Dyad Studio requires.

## Quick start

See the [**Dyad Getting Started guide**](https://help.juliahub.com/dyad/dev/tutorials/getting-started.html) 
for an introduction to Dyad Studio.

## Features

Dyad Studio is a development environment for [the Dyad modeling platform](https://help.juliahub.com/dyad/dev/).  With this extension you can:
- Create new component libraries
- Generate Julia code from Dyad models (including auto-compile options)
- Start a Julia REPL for running, simulating and analyzing models 
- Syntax highlight Dyad models
- Test Dyad models

<img alt="Dyad Create command" width=700 src="https://gist.githubusercontent.com/asinghvi17/6e132ffda4e1d554961ad261a20cf2e9/raw/c35e7d90fcd17b74ef1664418c64fd3913e9a247/Dyad%2520Create.gif"/>

<img alt="Dyad Compile command" width=700 src="https://21693537.fs1.hubspotusercontent-na1.net/hubfs/21693537/Dyad%20Studio/GIFs/Dyad%20Compile.gif"/>
