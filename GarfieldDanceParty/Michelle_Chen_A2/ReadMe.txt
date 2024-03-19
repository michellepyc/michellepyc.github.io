
// WARNING FLASHING COLORS//
Before playing video there are flashing colors and lights
There is a ~9 second period without flashing lights in the begginning


1. hierarchical object of at least two-levels
    [Completed]
    Garfiled is made of hierarchies
    so are the speakers and music notes
    Lines: [] main.js


2. Make use of at least two textures
    [Completed]
    Proceduraly mapped the disco floor + mixed with custom shader for rbg lights
    Used two textures layered on top of eachother to create a halftone effect
    Lines: [] main.js / [] main.html


3. Vertext to Fragment
    [Completed]
    Took lightpos, normal and position and passed into fragment shader
    lines: [] main.html

4. Modified to Blinn-Phong
    [Completed]
    Used modified math from https://www.jordanstevenstechart.com/lighting-models 
    lines: [] main.html

5. Shader edited or designed
    [Completed]
    In vertex shader I computed a rainbow effect using a color palette fromhttps://iquilezles.org/articles/palettes/
    It changes based on time passed from main.js
    This is then used on the disco floor and applied on objects in the fragment shader
    
    In the fragment shader I computed a banded lighting effect with most math from https://www.jordanstevenstechart.com/lighting-models
    This is used to give the scene a cartoon-like look
    Lines: basically all of main.html


6. 360 Degree fly around
    [Completed]
    Converted the vec3 into an array that can be changed golbally
    Used sin and cos math functions and passed time into them
    The camera will move based on time passed
    Lines: []

7. Connection to realtime
    [Completed]
    All animation is based on either Timestamp or RealTime = timestamp/1000
    Or using dt
    Lines: all of main.js, some of main.html 

8. Frame Rate 
    [Completed]
    Framerate is computed at 1/dt and is updated when timestamp/1000 %2 ==0 
    - When the time is a even number
    Lines: [] main.js

9. Complexity
    [Subjective]
10. Creativity
    [Subjective]
11. Quailty
    [Subjective]

Clarifications:
    Lab7 Basecode used
    A1 custom wave function imported from A1

