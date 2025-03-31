import numpy as np 
import pygame 
# from core import World, Cell, Food
from type_test import World, Cell, Food
from params import Color, _color

""" 
=====================================================================================
2. Rendering the world
"""

# pygame setup
size = 800
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




world = World(75) # size




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

    if world.get_avialable_spaces().size == 0: 
        print("--------No available space--------")
    else: 
        c = Cell(world)

        # while len(world.matter["Cell"]) < 50:
        #     c = Cell(world)

        # while len(world.matter["Food"]) < 10:
        #     f = Food(world)


    
    for cell in world.matter["Cell"]:
        if type(cell) is Cell:
            render_matter(cell, world, cell.color, rendering_face=False)
            
            cell.ask_next_move()
            
            # cell.aging()

            # if cell.energy <= 0 or cell.age > 100:
            #     cell.die()

    for food in world.matter["Food"]:
        if type(food) is Food:
            render_matter(food, world, Color.YELLOW)


    # print(f"face: {c1.face}, location: {c1.current_location} \n")
    print(f"world.spaces: \n {world.spaces} \n \n")

    pygame.display.flip()
    clock.tick(60)
pygame.quit()