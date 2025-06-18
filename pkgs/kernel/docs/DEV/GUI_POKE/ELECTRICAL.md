---
order: 100
icon: ":electric_plug:"
---

# Building Electrical Systems

The commentary below is in reference to the following video:

[![Dymola Electrical Systems](http://img.youtube.com/vi/srYMGsR5g9A/0.jpg)](http://www.youtube.com/watch?v=srYMGsR5g9A "Dymola for Electrical Systems")

## 0:00 - 0:55

This introduces the **package browser**. This is similar to how the Dyad
Playground was organized. The point is that you have a collection of component
models. This is what I would call a "source code oriented" view. It shows all
the component models that are available but in a structure that mirrors the
source code. This is certainly one way to do this and it is familiar to the
person who developed those models. But ultimately I think the person who depends
on such libraries (as opposed to the developer of the libraries) really doesn't
need this view. They'll want something that allows them to filter based on
domain (e.g., electrical, mechanical), search by name or (best of all in my
opinion) anticipate what the user would like. Note that Dyad, like Julia, has
a module system (not totally implemented at this point though) so it can
represent the kinds of hierarchical packages shown in this section of the video.

## 0:55 - 1:18

**Model Building** is the focus of this section. Calling this a "drag and drop
maneuver" feels very "lost in translation", but creating models via drag and
drop is definitely an important aspect of the model building process. This is
how you use the tool assuming all the component models have already been built.
Creating component models (i.e., containing equations) is a different exercise.
More on that later. One thing note here (~1:10) is the deficiency of the package
browser. The user has to open and close all these different hierarchical
packages to find the component they want.

!!! Aside on "Smart Palette"

To me, the ultimately solution here is for the tool to anticipate what the user
might need. Not how at 1:10 in the video we have a single ground component. As
such, the tool should know that the next component the user is going to drag
down is almost certainly going to be electrical. Because Modelica and Dyad
both have a formal type for connectors, we would then be looking for components
that share this same connector (as the components already in the schematic). But
machine learning techniques can "see" the importance of such relationships as
well just from studying usage patterns. The bottom line is that we need to
support the "usual" drag and drop approach but we'll ultimately want to do
better than what you see in this video.

!!!

## 1:18 - 1:29

Here we see different ways of interacting with a component that is already in
the schematic. Rotating (and flipping) are already mentioned in our customer
facing roadmap. We also need to be able to edit the parameters. Note the
information in this dialog. For example, note how it shows a small version of
the component's icon in the corner (nice touch).

The component name and description of the component are at the top. These are
both represented in Dyad already. Note that Dyad presumes that the
comment (I prefer to call it a description) is in Markdown. As such, the
ability to bring up a basic multi-line text editor will eventually be a nice
touch but a single line is sufficient for now. Ultimately, a markdown editor
with preview (which is almost trivial to do in a browser) would be nice touch
here.

After the information about the component, you still see some (read only)
information about the model. Just to clarify here, what the user is creating
here is an _instance_ of the `PulseVoltage` model (with the default name being
`pulseVoltage` as shown in the `Name` field). The "Path" and "Comment" field in
this section of the dialog are about the `PulseVoltage` component model not
about this particular instance. In C++ terms, `PulseVoltage` is the _class_ and
what we are editing here are "members" of an instance of the class.

Also part of the instance are the parameters, which are listed below. Dyad,
like Modelica, should give us a pretty rich data model of what is going on here.
There is already code to, for example, create a JSON schema for each parameter
in a model. But you JSON schema is just one representation of that information.
The important point here is that the introspection capabilities in Dyad allow
you to query the model for the parameters involved, the default values, their
description, their units, the min and max values, _etc_ (everything needed to
build such a dialog).

## 1:29 - 2:00

Now we get into connections. A few comments. The basic mode of connecting
things is shown here which is click on one, click on the other, draw a route in
between. There are several additional comments worth making at this point:

- Users will want to adjust this route. The example in the video looks
  terrible, for example.
- I'm all for routing "assistance", but at the end of the day the user has to
  have ultimate control over the routing.
- If the model we were building here was ultimately going to be connected to
  other models, we would need a way to create connectors **on this component**.
  This use case isn't demonstrated in this video so I won't spend much time
  trying to describe (hopefully I can find another video that demonstrates
  this). But in such a case, we would start our connection but instead of
  connecting it to another component, we'd need a gesture that terminates the
  connection at a new connector (detailed discussion to follow).
- One of the things that Fredrik had proposed was that when the user is in the
  midst of creating a connection it would be nice if _this_ was the time that
  they were potentially presented with options of the component to connect to.
  So instead of what we see in this video where the user drags down two
  components and then connects, the workflow would be that the user drags down
  one component (say ground) and then initiates a connection from the ground to
  a point in space and then performs some gesture that triggers a menu of
  potential components to instantiate at the other end of the connection (and
  then somehow prompts to user to specify which connector on the soon to be
  instantiated component to connect to).

With the op-amp, I just want to point out one thing. There is a parameter called
`useSupply`. If you look carefully at the icon in the dialog at 1:51 you'll see
that there are **5** connectors in that picture. But when they close the dialog
you see that the component in the schematic has only **3**. The reason is that
two of those connectors are _conditional_ and their presence is determined by
the value of the `useSupply` parameter. So the bottom line is that choices in
the parameter dialog can impact the physical interface of the device. This is a
Modelica feature and I think we'll ultimately end up with similar functionality
in Dyad (but it isn't there yet).

## 2:00 - 2:23

Note how some parameters have default values and others don't. One thing that
Dyad will attempt to do is perform as many static checks as possible
searching for issues in the models. One issue would be when there is no value
for a parameter. In order to perform a simulation, _Every parameter needs a
value_. Some models come with "default" values that are used if none is
provided. You can see these in gray in the dialog. However, note that Boeing
intends to have a strict rule against this (and they are right). Including
literal values in these models is a very bad idea because of "silent failures".
For any safety critical system, parameter setting should be very deliberate and
note left to defaults. As an aside, the same thing is true of initial
conditions.

Now, it is generally quite tedious to provide individual values for every
parameter. This is especially true when a single component (like an air
conditioning compressor) might have tens of parameters. This is where
"parameter structs" come in. Modelica has them and so does Dyad. The idea
here is that parameters could be grouped together into a struct and then all the
parameters associated with a given component could be expressed by a single
value (an instance of the struct). They don't use that functionality here so I
won't get into that, but just be aware that the functionality exists.

Note at 2:10 how they flight the resistor but the text stays left to right.
This is why I think we need to separate out the text from the graphics. The
graphic flips, as expected, but the text basically stays the same. They get
away with this because Modelica isn't using SVG but rather their own vector
graphic format and the rendering of that data doesn't perform the transformation
on the text. Sadly, this is not the case with SVG. As such, I'm proposing that
we add a special `labels` extension to the Dyad metadata specifically for
text and allow not just literal text but templates (_e.g.,_ `$(instanceName)` or
`R = $(R)`).

## 2:23 - 2:40

At 2:23, they drag down a capacitor. First, please note that nobody builds
models this haphazardly. This really is an atrocious schematic (in terms of
component placement). But ignore that and focus on the units of the capacitor.
They demonstrate that you can choose to enter the units in microfarads (µF) or
farads (F). A key thing to understand about both Modelica and Dyad is that
the variable is always in **SI Units**. But you can enter, print or plot
_values_ in other units. This is what she means when she says "Dymola handles
unit conversion in the background". Unfortunately, since they chose SI units in
the dialog the narration doesn't make sense. But also notice that she enters
1.6e-4F. That's an odd unit. Why didn't see enter "160µF"? Also, why not "0.16mF"
(note that "mF" wasn't even an option).

!!! Literal Values

In Dyad, all scientific prefixes are supported for literals. So you could
literally type `0.15m` or `160µ` as the value in that dialog and that would be
legal as far as Dyad is concerned. But this means that the GUI elements are
not quite just "numbers".

!!!

## 2:40 - 2:50

Notice that the connections allow "T" type connections. Modelica doesn't
actually support this behind the scenes and I'm not 100% sure how Dymola
represents it. But it is worth pointing out that Dyad does support
connections involving multiple connectors across multiple components and the
Dyad metadata already prescribes how the routing information is managed.

## 2:50 - 3:10

She says "suppose we wanted a visual indicator for the op-amp's output signal".
Whoever wrote this explanation is wrong. This has _nothing to do with
visualization_ and is very different from "other tools". In Modelica, you get
all variables by default...whether you put that sensor in there or not. The
reason you put a sensor in so you can extract the single you are interested in
as a _causal connector_ which can then be fed to other causal connector.
Explaining why that is important is beyond the scope of this commentary though.
But just keep in mind it had nothing to do with visualization. It is the "show
component" block (only) that is related to visualization.

## 3:10 - 3:25

This demonstrates a feature of Modelica that I don't think we should mirror.
It is true that this dialog is allowing you to control what is called the
`start` attribute of the `v` variable and also to control the `fixed` attribute
of that variable. The net effect is to specify an initial condition. I
wouldn't worry about this use case. A much better way to handle this is to
create dialogs that only include initial conditions (and then some parameters
may, under the hood, be used to control initialization). But from a GUI
perspective, they are all parameters.

## 3:25 - 3:56

Note the tabbed interface here. What they did was "zoom in" to the definition
of the `IdealOpAmpLimited` model. Effectively, they switched to editing a
completely different model. But note the choice of a tabbed interface (much
like browser tabs). This allows you to keep several models open at the same
time.

Another thing they are demonstrating here is something that I attempted to
demonstrate with the Dyad Playground which is that their are multiple aspects
to a given definition. They mention the "diagram", "coding" and "documentation"
layers. But they don't really show this in detail but you'll see some of this
later.

## 3:56 - 4:15

This is a more typical Modelica model. Note multi-domain aspect of this model.
In this context the domains involved are thermal (indicated by the red square
connectors), rotational (round gray connectors), data flow (blue triangles),
electrical (blue squares) and fluid (blue circular connectors).

The layout here is much better as well.

## 4:15 - 4:33

OK, now they jump back to their original model. Note the key thing they are
demonstrating here which is that they have switched from a "model building"
context to a "model analysis" context. That is what the tab in the lower right
corner is about. I'm not a big fan of this design. I think some of the current
thinking around defining experiments (or at least proto-experiments) in Dyad
(metadata?) integrate these different aspects of the modeling activity better
than this.

## 4:33 - 5:30

Recall my earlier comment about the sensor not being related to visualization.
We can see this in the signal browser on the left. If you look you'll see that
there are a tremendous number of signals available to view. We don't need to
specify _a priori_ what we want to look at.

Here we see one reason why I think the "model building" vs. "model analysis" is
a bit contrived. We see that at 4:59 they now bring the same diagram into this
view as well. Integrating analysis and composition together would result in a
single diagram but in the context of an analysis result, that (same) diagram
could be animated.

The animation part is neat, but I think a _better_ way to do this would be to
allow the user to "probe" any of the connectors or components _at any time_
during the animation and have some kind of "meter" popup up showing the signal
value, a strip chart, etc. Do this dynamically would avoid lots of annoying _a
priori_ instrumentation like they've done here.

A similar issue happens at 5:19 where they want to change a parameter. They
have to go over to that ugly tree element to change the parameter. What
happened to changing parameters by clicking on the component in the diagram?
You've _got the diagram right there_ but you don't use it?!?

## 5:30 - 5:36

Dymola has a very limited "results" tracking capability. You can see it here
after they run the second simulation. The `MyLowPass 1` and `MyLowPass 2`
entries in the results tree are showing to different simulation results. But
there is no real context here (what is the difference between them?) and _they
aren't persisted_. There are so many opportunities to improve on this,
particularly in a cloud based context.
