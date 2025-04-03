import numpy as np 
import pygame
import random

WIDTH = 700 
HEIGHT = 700
TILE = 5
TILESIZE = WIDTH // TILE 
DISPLAY_WIDTH = WIDTH + 300

# Colors
WHITE = (255, 255, 255)
YELLOW = (255, 255, 0)
RED = (255, 0, 0)
BLUE = (0, 0, 255)
GREEN = (0, 255, 0)
BLACK = (0, 0, 0)
ORANGE = (255, 128, 0)
PURPLE = (128, 0, 128)

COLORS = [YELLOW, RED, BLUE, GREEN, BLACK, ORANGE, PURPLE]


# Pygame setup
pygame.init()
screen = pygame.display.set_mode((DISPLAY_WIDTH, HEIGHT))
clock = pygame.time.Clock()
running = True

class World:
    def __init__(self):
        self.space = np.zeros((TILE, TILE), dtype=object) # Zero map, deafult value 0 is free. 
        self.birth_time = np.datetime64('now')
        self.birth_cell = 0
        self.dead_cell = 0
        self.lifes = []
        
    def add_cell(self, cell):
        self.space[cell.row, cell.col] = cell
        self.birth_cell += 1
        self.lifes.append(cell)

    def remove_cell(self, cell):
        self.space[cell.row, cell.col] = 0
        self.dead_cell += 1
        self.lifes.remove(cell)

    def find_empty_spot(self):
        empty_spot = np.where(WORLD.space == 0)
        if len(empty_spot[0]) > 0:  # Check if there are empty spots
            index = random.randint(0, len(empty_spot[0]) - 1)
            row = empty_spot[0][index]
            col = empty_spot[1][index]
            return row, col
        else:
            return None  # No space available
        
WORLD = World()

class Cell:
    def __init__(self):
        self.alive = True
        self.color = random.choice(COLORS)
        self.age = 0
        row_col = WORLD.find_empty_spot()

        if row_col:
            self.row, self.col = row_col  # Get row and col from find_empty_spot
            self.x = self.col * TILESIZE  # Calculate x and y from row and col
            self.y = self.row * TILESIZE 
            WORLD.add_cell(self)
        else:
            self.alive = False # If no space, mark as not alive.

    def live(self):
        if self.alive and self.age > 5:
            self.die()
        if self.alive:
            # self.age += pygame.time.get_ticks() / 1000
            self.age += 1
            print("Age: ", self.age)
            print("T: ", pygame.time.get_ticks()/1000)
            rect = pygame.Rect(self.x, self.y, TILESIZE, TILESIZE)
            pygame.draw.rect(screen, self.color, rect, 0)
        else:
            return

    def die(self):
        # after the set age, it dies.
        self.alive = False 
        WORLD.remove_cell(self)
        

def draw_grid():
    grid_color = BLACK
    for x in range(0, WIDTH, TILESIZE):
        pygame.draw.line(screen, grid_color, (x, 0), (x, HEIGHT))
    for y in range(0, HEIGHT, TILESIZE):
        pygame.draw.line(screen, grid_color, (0, y), (WIDTH, y))



# for x in range(TILE*TILE):
#     a = Cell()
#     lifes.append(a)
#     print(x)


# c = Cell()
# c1 = Cell()
# c2 = Cell()

# Font
myFont = pygame.font.SysFont( "arial", 13)


while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    
    screen.fill("white")
    draw_grid()
    
    # for x in lifes:
    #     x.live()
    
    # c.live()
    # c1.live()
    # c2.live()

    # c3 = Cell()
    # lifes.append(c3)
    


    if WORLD.find_empty_spot():
        c = Cell()

    for cell in WORLD.lifes:
        cell.live()

    # Information board
    # 1. Time
    world_birth_time = myFont.render("World Birth Time: " + str(WORLD.birth_time), True, BLACK)
    world_space = myFont.render("World Space: " + str(np.where(WORLD.space == 0)), True, BLACK)
    world_birth_cell = myFont.render("World Born Cell: " + str(WORLD.birth_cell), True, BLACK)
    world_dead_cell = myFont.render("World Dead Cell: " + str(WORLD.dead_cell), True, BLACK)
    time = myFont.render("Time: " + str(pygame.time.get_ticks()), True, BLACK)
    
    print("World space: ", np.where(WORLD.space == 0))
    
    screen.blit(world_birth_time, [WIDTH+50, 50])
    screen.blit(world_space, [WIDTH+50, 100])
    screen.blit(world_birth_cell, [WIDTH+50, 150])
    screen.blit(world_dead_cell, [WIDTH+50, 200])
    screen.blit(time, [WIDTH+50, 250])


    pygame.display.update()
    clock.tick(1)
pygame.quit()