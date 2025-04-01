# Simulation, Life, Cell and World

![screenshot from the play](<Screenshot 2025-04-01 at 08.58.04.png>)

Designed and created by Ryu Sung Chul. 2025.

## Motivation
Draw and simulate the world. how it works from the beginning. Explore the relationship between environment, such as world itself, earth, universe, etc, with living ones like human itself. It's somewhat unclear that what has information? World has known all the information? and living one, agents are only knowing very subtle side of the informations? It affects each others. It creates themselves and it's, life is one of natare's expression. 
I would like to express or create logic from very simple logic to complex and complicated emergency situations.

<video controls src="Screen Recording 2025-03-29 at 09.55.31.mov" title="Real time playing" width=800, height=800></video>

## Logic 
1. World is created with spaces.
2. Cell is born within world.
4. Cell dies in the world.

## World
World is where all the matters, such as cell and food, live and die.
It gives spaces and some other informations.
You can set the size of the world.

## Matter
Proto type of life.
Sub classes: Cell, Food

## Food
food for cell
1. location
2. state {is_alive, dead}

## Cell
Cell is a living one. it's born with name, age, color, face(direction).
1. born: born with a given world
2. die: die itself
3. move: move somewhere
4. eat
5. reinforcement learning
6. aging

# How to play
python main.py

## Requirements
numpy, pygame

