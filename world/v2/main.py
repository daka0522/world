import numpy as np 
import pygame 
from core import World, Cell, Food


""" 
=====================================================================================
2. Rendering the world
"""

# pygame setup
size = 500
DISPLAY_WIDTH = size
DISPLAY_HEIGHT = size 

pygame.init()
screen = pygame.display.set_mode((DISPLAY_WIDTH, DISPLAY_HEIGHT))
clock = pygame.time.Clock()
running = True  


#set up the colors
WHITE = np.array([255, 255, 255])
YELLOW = np.array([255, 255, 0])
RED = np.array([255, 0, 0])
BLUE = np.array([0, 0, 255])
GREEN = np.array([0, 255, 0])
BLACK = np.array([0, 0, 0])
ORANGE = np.array([255, 128, 0])
PURPLE = np.array([128,0,128])

COLORS = [RED, BLUE, GREEN, ORANGE, PURPLE]


def render_world(world: World) -> None:
    grid_color = WHITE 

    tile_width = DISPLAY_WIDTH // world.WIDTH
    tile_height = DISPLAY_HEIGHT // world.HEIGHT

    for x in range(0, DISPLAY_WIDTH, tile_width):
        pygame.draw.line(screen, grid_color, (x, 0), (x, DISPLAY_HEIGHT))
    for y in range(0, DISPLAY_HEIGHT, tile_height):
        pygame.draw.line(screen, grid_color, (0, y), (DISPLAY_WIDTH, y))

def render_cell(cell: Cell, world: World, color=RED, rendering_face=False) -> None:
    """
    Render cell 

    Parameters
    ---------
    cell: Cell
    world: World
    color: (int, int, int)
        RGB value 0~255
    """

    width = DISPLAY_WIDTH / world.WIDTH
    height = DISPLAY_HEIGHT / world.HEIGHT

    if cell.is_alive:
        row, col = cell.current_location
        x_position = col * height
        y_position = row * width

        rect = pygame.Rect(x_position, y_position, width, height) # (x, y, width, height)
        pygame.draw.rect(screen, color, rect)

        if rendering_face:
            render_face(cell, x_position, y_position)



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
        myfont = pygame.font.SysFont("Comic Sans MS", 12)
        label = myfont.render(f"{cell.name}", 1, WHITE, BLACK)
        label2 = myfont.render(f"{cell.face} {arrow}", 1, WHITE, BLACK)
        label3 = myfont.render(f"{cell.current_location}, ({np.round(x_position)}, {np.round(y_position)})", 1, WHITE, BLACK)
        screen.blit(label, (x_position+10, y_position+10))
        screen.blit(label2, (x_position+10, y_position+30))
        screen.blit(label3, (x_position+10, y_position+50))





world = World(10) # size




"""
==============================================================
running
"""

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    screen.fill(BLACK)

    # render_world(world)

    if world.get_avialable_spaces().size == 0: 
        print("--------No available space--------")
    else: 
        while len(world.matter["Cell"]) < 3:
            c = Cell(world)

        while len(world.matter["Food"]) < 3:
            f = Food(world)


    
    for cell in world.matter["Cell"]:
        render_cell(cell, world, cell.color)
        cell.ask_next_move()
        # cell.aging()

        # if cell.age > 30:
        #     cell.die()

    for food in world.matter["Food"]:
        render_cell(food, world, YELLOW)


    # print(f"face: {c1.face}, location: {c1.current_location} \n")
    print(f"world.spaces: \n {world.spaces} \n \n")

    pygame.display.flip()
    clock.tick(30)
pygame.quit()