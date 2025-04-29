import numpy as np 
import pygame 
# from core import World, Cell, Food
from core import World, Cell, Food
from params import Color, _color
import os
import random

""" 
=====================================================================================
2. Rendering the world
"""

# pygame setup
size = 720
DISPLAY_WIDTH = size
DISPLAY_HEIGHT = size 

pygame.init()
screen = pygame.display.set_mode((DISPLAY_WIDTH, DISPLAY_HEIGHT))
clock = pygame.time.Clock()
running = True  


def render_world(world: World) -> None:
    grid_color = tuple(Color.WHITE )

    tile_width = DISPLAY_WIDTH // world.WIDTH
    tile_height = DISPLAY_HEIGHT // world.HEIGHT

    for x in range(0, DISPLAY_WIDTH, tile_width):
        pygame.draw.line(screen, grid_color, (x, 0), (x, DISPLAY_HEIGHT))
    for y in range(0, DISPLAY_HEIGHT, tile_height):
        pygame.draw.line(screen, grid_color, (0, y), (DISPLAY_WIDTH, y))

def render_matter(matter: Cell | Food, world: World, color: _color = Color.RED, rendering_face=False) -> None:
    """
    Render matter 

    Parameters
    ---------
    matter: Cell | Food
    world: World
    color: (int, int, int)
        RGB value 0~255

    rect((x,y), widht, height)
    (x,y)--------
    |           |
    |           | height
    |           |
    -------------
    width
    """

    width = DISPLAY_WIDTH / world.WIDTH
    height = DISPLAY_HEIGHT / world.HEIGHT

    if matter.is_alive:
        if matter.current_location is not None:
            row, col = matter.current_location
            x_position = col * height
            y_position = row * width

            rect = pygame.Rect(x_position, y_position, width, height) # (x, y, width, height)
            pygame.draw.rect(screen, tuple(color), rect)

            if type(matter) is Cell and rendering_face:
                render_face(matter, x_position, y_position)



def render_face(cell: Cell, x_position, y_position):
    # render face
    if hasattr(cell, "face"):
        if cell.face == 0:
            arrow = "Front"
        elif cell.face == 1:
            arrow = "Right"
        elif cell.face == 2:
            arrow = "Back"
        elif cell.face == 3:
            arrow = "Left"
        else:
            arrow = "None"

        myfont = pygame.font.SysFont("Comic Sans MS", 10)
        label = myfont.render(f"{cell.name}", 1, tuple(Color.WHITE), tuple(Color.BLACK))
        label2 = myfont.render(f"{cell.face} {arrow}", 1, tuple(Color.WHITE), tuple(Color.BLACK))
        label3 = myfont.render(f"{cell.current_location}, ({np.round(x_position)}, {np.round(y_position)})", 1, tuple(Color.WHITE), tuple(Color.BLACK))
        label4 = myfont.render(f"E: {cell.energy}, Age: {cell.age}", 1, tuple(Color.WHITE), tuple(Color.BLACK))

        # Rendering
        screen.blit(label, (x_position+10, y_position+10))
        # screen.blit(label2, (x_position+10, y_position+30))
        # screen.blit(label3, (x_position+10, y_position+50))
        screen.blit(label4, (x_position+10, y_position+30))



WORLD_SIZE = 300
world = World(WORLD_SIZE) # size


# Diffusion from center of canvas, born cells around center
center = WORLD_SIZE // 2
radius = 10  # Radius of the circle
number_of_cells = 500


# for x in range(number_of_cells):
#     for y in range(number_of_cells):
#         c = Cell(world, (center - number_of_cells + x, center - number_of_cells + y))

# for i in range(number_of_cells):
#     angle = 2 * np.pi * i / number_of_cells  # Divide the circle into equal parts
#     x = center + int(radius * np.cos(angle))  # X-coordinate
#     y = center + int(radius * np.sin(angle))  # Y-coordinate
#     c = Cell(world, (x, y))

for i in range(number_of_cells):
    # Generate random spherical coordinates
    theta = 2 * np.pi * random.random()  # Angle around the z-axis
    phi = np.arccos(2 * random.random() - 1)  # Angle from the z-axis

    # Convert spherical coordinates to Cartesian coordinates
    x = center + int(radius * np.sin(phi) * np.cos(theta))  # X-coordinate
    y = center + int(radius * np.sin(phi) * np.sin(theta))  # Y-coordinate

    # Create the cell at the calculated position
    c = Cell(world, (x, y))


""" Save as an images """
saving = False

# To save as images file
frame_count = 0

# Create a directory to save the frames if it doesn't exist
output_dir = "saved_frames"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)


"""
==============================================================
running
"""
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    screen.fill(tuple(Color.BLACK))

    # render_world(world)

    # if world.getFreeLocation().size == 0: 
    #     print("--------No available space--------")
    # else: 
    #     c = Cell(world)

    
    for cell in world.matter["Cell"]:
        if type(cell) is Cell:
            render_matter(cell, world, cell.color, rendering_face=False)
            
            # cell.ask_next_move()
            
            # RL function
            new_location = cell.sense_front()
            next_state = cell.ask_whats_next(new_location) 
            history = cell.expect(next_state)
            action = cell.best_action(history)
            reward = cell.do_action(action, next_state, new_location, enable_color_add=False) 
            cell.remember(next_state, action, reward)

            # print(f"Cell: {cell.name}, Memory: {cell.memory}")

    for food in world.matter["Food"]:
        if type(food) is Food:
            render_matter(food, world, Color.YELLOW)

    if saving is True:
        filename = os.path.join(output_dir, f"frame_{frame_count:04d}.png")
        pygame.image.save(screen, filename)
        frame_count += 1
    
    pygame.display.flip()
    clock.tick(30)
pygame.quit()




                