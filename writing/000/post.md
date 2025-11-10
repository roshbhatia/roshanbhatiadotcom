---
title: "Keyboard designing for the egotistical"
date: "2025-11-08"
---

In September, my friend [Tristan](https://khedron.net/) said he was designing a keyboard. He had spoken to our mutual friend [Dede](https://github.com/dededecline) who has created many keyboards (see https://github.com/dededecline/SST60) and found out that it was a lot simpler than he (and I) previously thought it was.

Clowing on each other is the core of our friendship, so, I decided to make one too.

**Disclaimer:** I am not an expert in keyboard design, ergonomics, PCB design, CAD, or firmware. I got a C in my high school physics class. I write `yaml` for a living. So take every fact I state here with a grain of salt.

## The beginning of the end (layouts)
**Background knowledge**:

- Ergonomic keyboards are a relatively overloaded term, but in this piece I use the term to mean any keyboard that is designed to be relatively ergonomic compared to more traditional designs. What I characterize as "less extreme" ergonomic keyboards are ones like those Microsoft ergo keyboards that have some level of sloping, or a split keyboard I have below which is a normal keyboard chopped in half. "More extreme" would be something like an ortholinear, column staggered keyboard which fundamentally moves the placement of keys compared to the staggered design most of us are used to.
- I just use QWERTY as the layout, I'm not yet interested in moving to DVORAK or COLEMAK.

**Resources**:

- [Keyboard Layout Editor](http://www.keyboard-layout-editor.com/) (layout generator for more normal keyboards)
- [Ergogen](https://ergogen.xyz/) (layout generator + PCB generator geared towards more ergonomic keyboards)
---

I started with trying to generate a layout that was more tuned to me. I knew I wanted something somewhat split (i.e., like an Alice layout) as I've had been using a more traditional, staggered split keyboard for a while because of wrist pain. My workflow on my dev machines have been clustered around "leader" keys with various vim-like navigation keybindings, so I wanted keys I typically strain to hit (Command/Win, Alt, and Space) to be more easily accessible.

![My Keychron Q11](assets/split.jpg)

To design this I had two options — Keyboard Layout Editor (KLE) and Ergogen. I ended up going with KLE as it was pretty straightforward to use in comparison — KLE just took a 2D JSON array of key placements, whereas Ergogen seemed a lot more powerful but more geared towards what I considered at the time to be more extreme ergonomic keyboards, which typically are typically literally split (like my Keychron), which have some design considerations and additional complexity I'll get into later. It's worth it to note that you don't have to commit to that with Ergogen — I found out later that you can have a unibody keyboard just as easily, but you'll find out throughout this piece that I make a lot of assumptions that backfired on me.

![Here's an insane early design I considered using. Not actually ergonomic!](assets/C1BDE35F-830E-4651-96EA-4A18278173FA.png)

I ended up trying to copy the staggered keyboard layout somewhat for key placements after realizing trying to reinvent the wheel in terms of core key placements was a ridiculous idea. So I decided on the following design, which was nearly still as ridiculous.

![12 space keys and 4 shift keys was nuts, in retrospect](assets/Screenshot_2025-10-07_at_5.36.08_PM.png)

I also made an insane assumption that it would make sense to use a bunch of 1U (your typical square key's size) keys in lieu of larger ones for "simplicity" to avoid needing to purchase/install stabilizers for things like shift, space, etc.

With the benefit of hindsight: I should have copied a more traditional split layout with some minor tweaks. The 1U hack didn't end up being a hack and ended up just being confusing. That being said, this was probably the most fun aspect of the build. I spent hours trying new layouts and messing with things that looked cool and sending ideas back and forth with Tristan.

## The middle bit(?) of the end (PCB design)
**Background knowledge**:

- Most keyboards are wired pretty simply — each key's switch has a uniquely assigned row and column combination, which corresponds to two pins on the microcontroller, which means you can write your firmware code to watch for that specific combination and output a character.
- I didn't realize I needed a ground pour, but fortunately I messed up my order from JCLPCB (with a separate issue), so they cancelled and sent me a message, letting me fix some other issues I introduced.

**Resources**:

- [https://www.kicad.org/](https://www.kicad.org/) (Free PCB CAD utility)
- [https://keyboard-tools.xyz/](https://keyboard-tools.xyz/) (KLE → Kicad project converter)
- [https://www.raspberrypi.com/products/raspberry-pi-pico/](https://www.raspberrypi.com/products/raspberry-pi-pico/) (The microcontroller used for this build)
---

### Handwiring or PCB?

After deciding on a layout, the next step was to choose one of two routes — handwiring, or fabricating a PCB.

Handwiring is objectively simpler and easier — you straight up just have some switches, a microcontroller, and solder connections directly to the microcontroller. If you have cables that intersect, they can just go over/around each other. No big deal here, but you do loosely commit yourself to soldering wires directly to the microcontroller.

A PCB introduces a few more variables into the mix — when traces (which are akin to wires) intersect, you need to account for that by punching holes through the board (called a 'via'). And you run the possibility of energy/heat sticking around on the board, so you need a big area of copper to help dissipate it called a "ground pour". I don't think a simple PCB like this actually needs one for relatively simple keyboards, but ultimately I was scared and added one anyways.

I decided to ultimately go with a PCB because I was scared of soldering — it's simple, I've done it before, but I have a hand tremor that makes playing the Wii difficult so I didn't want to commit to getting frustrated when I solder the wrong bit 4 times in a row.

### Designing the PCB

The first major choice around the PCB design was choosing a microcontroller. The RPI Pico 2 is now the gold standard for little projects like this — it's cheap, it's well supported by every major keyboard firmware project, and it's geared towards beginners. I looked at other microcontrollers but ultimately for this project there wasn't any need to really evaluate any other products given the overwhelming support for these.

Then I moved to thinking about wiring. This isn't particularly interesting, you just draw rows and columns and choose pins on the microcontroller to assign them to. I changed this a bit as I worked for some of the more uniquely placed keys but ultimately this stayed the same and didn't change too much. You can use tools like [https://kbfirmware.com/](https://kbfirmware.com/) if you have fewer keys to autogenerate firmware and a wiring matrix for you, but it only supports certain microcontrollers. While I didn't use the generated artifact from the site, I found it useful to conceptulaize how the matrix should look as they provide you with a visualization on the site itself.

I ended up using [KeyboardToolsXYZ](https://keyboard-tools.xyz/) to generate a (unwired) Kicad project file to start with. For the more dev inclined, Kicad has a Python based scripting engine that can be used for automating placements of "footprints" (think reusable components: diodes, the microcontroller, or your key switches) but it's something I encountered issues with. Rather than needing to script anything yourself, the KeyboardToolsXYZ just takes your KLE JSON and automates placing these footprints in a blank file for you.

Back to wiring itself -- this portion is pretty straightforward, and Kicad provides utilities to help you track places where one point needs to get wired to another (referred to as 'nets'.) Kicad will help you try to pathfind as you draw, so you just need to click on one point and guide it along to the final point. This required a few iterations to ensure the traces were routed cleanly to the right places with minimal manual adjustments. I ended up using a 4 layer PCB — front, back, and two internal ones. I ended up keeping row traces on the front of the board, and column on the back, with two internal layers for some more traces if I had issues routing on the same layer, and the ground pour to help dissapate heat (which was wired up to the ground points on the microcontroller.)

I also snagged some cool graphics to get printed on the outside (called a silkscreen), which were nicely provided by my buddy [Trevor](https://www.instagram.com/iamzoop/).

![](assets/pcb_traces.png)

![](assets/pcb_front.png)

The final bit before production was to choose some parts and get it fabricated. This ended up being way more expensive than I thought due to tariffs, but the cheapest option was ordering from [JCLPCB](https://jlcpcb.com/) which was recommended by many people to me. To get this produced, I needed to do the following:

- Map footprints to real-world parts and generate a file called a BOM (bill of materials). I used JCLPCB's parts library to find their internal part number for diodes, hotswap switches, and microcontroller (which they do carry!) and used Kicad to generate the BOM, which I uploaded as part of my order.
- Export via Kicad as a set of production files. This includes models for each layer as well as positions of parts I wanted soldered on by JCLPCB.
- Upload to JCLPCB, choose a color and material type for the board, click order.

### Plate and case design
**Resources**:

- [KB Plate](https://kbplate.ai03.com/) (generates a plate for you from KLE JSON)
- [Fusion360](https://www.autodesk.com/products/fusion-360/) (CAD software that most hobbyists I've seen online use for plate and case design)
- [OpenSCAD](https://openscad.org/) (CAD software that relies more heavily on scripting)
---
While I could glue on switches to the PCB, Dede recommended I try a plate first. A plate has cutouts which switches snap into, and you can stick your PCB underneath. You'll find plates in most mechanical keyboards with a case, but by no means is a case required.

I almost got filtered by this. For the life of me I could not brute force Fusion360 despite using [https://kbplate.ai03.com/](https://kbplate.ai03.com/) to generate this initially and gave up and begged Tristan to help me out. He ended up verifying the placement of cutouts for me and doing some slight modifications to it, namely a cutout for the microcontroller's USB port and some bends to have the plate sit on a table.

![](assets/plate.png)

I ended up using [SendCutSend](https://sendcutsend.com/) to get this fabricated and shipped, which had a similar process to JCLPCB, where you upload a file and choose some customization options.

While waiting for the PCBs and plate to get fabricated, I also decided to make a case. I ended up using OpenSCAD for this as it has a scripting engine that made a lot more sense to me. I imported the plate's 3D model I exported from Fusion360 and did my best to sculpt a two part case that I would slide on around it.

![](assets/case.png)

Someone at work was fortunately kind enough to print the case for me for free, but I was evaluating using [CraftCloud](https://craftcloud3d.com/) to order this from some rando.

## The last bit (firmware)

**Resources**:

- [QMK](https://qmk.fm/)
- [ZMK](https://zmk.dev/)
- [KMK](https://github.com/KMKfw/kmk_firmware)
---

Writing firmware is also similarly straightforward. There's two major options right now — QMK and ZMK. Both have relatively similar levels of support for unibody keyboards, it's the extra bits around wireless connectivity, microcontroller support, rotary encoders, etc. which is where the differences lie.

QMK and ZMK require you to write some more low level code. I don't have an issue with this but the setup seemed a lot more complex than I thought it would have ended up being purely because of the number of features that QMK/ZMK support, like dynamic layout editing.

Ultimately I went with a third option — KMK. It's powered by CircuitPython, which is geared more towards beginners. Ultimately I chose it because it was simple and supported by my controller, which is what I wanted! My `main.py` is as follows, which just imports some data-only files that contain the mappings I mentioned earlier.

```python
from kmk.kmk_keyboard import KMKKeyboard
from kmk.extensions.media_keys import MediaKeys
from kmk.modules.mouse_jiggler import MouseJiggler

from hardware import COL_PINS, ROW_PINS, DIODE_ORIENTATION
from keymap import KEYMAP

print("Starting Terminus Est...")

keyboard = KMKKeyboard()

keyboard.extensions.append(MediaKeys())
keyboard.modules.append(MouseJiggler())

keyboard.col_pins = COL_PINS
keyboard.row_pins = ROW_PINS
keyboard.diode_orientation = DIODE_ORIENTATION

keyboard.keymap = KEYMAP

if __name__ == "__main__":
    keyboard.go()
```

Installing this is pretty simple — you follow the directions to install CircuitPython and just drag your firmware files on.

## Assembly

This part is straightforward. Stick stuff together and it works.

![](assets/Screenshot_2025-11-08_at_4.56.00_PM.png)

![](assets/Screenshot_2025-11-08_at_4.56.36_PM.png)

![](assets/Screenshot_2025-11-08_at_4.55.19_PM.png)

## Final thoughts

I'm never doing this again. I dunked on Tristan, but at what cost?! (The cost was $550).

The major realization I had is that ergonomic philosophy has been tackled by people who know what they're doing. I'm not one of them!

Fortunately: 75% of the way through this project, Tristan gave me his ZSA Voyager at the exact moment I decided to get a Corne keyboard, which is one of the more popular more extreme ergonomic keyboards. Both the Corne and Voyager are designed to be ortholinear, column staggered keyboards, which let you move your fingers in a much more natural way compared to a traditional keyboard.

I use the Voyager at home (with the new trackball attachment) with the same amount of keys and layout as I assigned to my Corne, which I now use at work.

![The ZSA Voyager, with navigator trackball, and some keys ripped out to match Corne's 3x6 layout](assets/Screenshot_2025-11-08_at_5.00.14_PM.png)

![My Corne v4.1 from YMDK](assets/Screenshot_2025-11-08_at_5.00.27_PM.png)

You can see the final product's repository [here](https://github.com/roshbhatia/terminus-est). This includes firmware, layout, production files, etc.
