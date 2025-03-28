# Example file showing a basic pygame "game loop"
import pygame
import random

WIDTH = 500
HEIGHT = 500
TILE = 5
TILESIZE = HEIGHT // TILE 

#set up the colors
WHITE = (255, 255, 255)
YELLOW = (255, 255, 0)
RED   = (255,   0,   0)
BLUE = (0, 0, 255)
GREEN = (0, 255, 0)
BLACK = (  0,   0,   0)
ORANGE = (255, 128, 0)
PURPLE = (128,0,128)

# pygame setup
pygame.init()
screen = pygame.display.set_mode((WIDTH, HEIGHT))
clock = pygame.time.Clock()
running = True

pressed = pygame.key.get_pressed()

class Agent():
    def __init__(self) -> None:
        self.color = ORANGE
        self.x = 0
        self.y = 0
        self.rect = pygame.Rect(self.x, self.y, TILESIZE, TILESIZE)

    def move(self):
        pressed = pygame.key.get_pressed()

        if pressed[pygame.K_UP] and self.y > 0: self.y -= move_tick
        if pressed[pygame.K_DOWN] and self.y < HEIGHT-TILESIZE: self.y += move_tick
        if pressed[pygame.K_LEFT] and self.x > 0 : self.x -= move_tick
        if pressed[pygame.K_RIGHT] and self.x < WIDTH-TILESIZE: self.x += move_tick

        self.rect = pygame.Rect(self.x, self.y, TILESIZE, TILESIZE)

        print("Agent move: ", (self.x, self.y))



class Wall():
    def __init__(self) -> None:
        self.color = BLUE
        self.x = 0
        self.y = 0
        self.rect = pygame.Rect(self.x, self.y, TILESIZE, TILESIZE)

    def generate(self):
        pass 

occupied = []
moveable_space = []

def generate_wall(x):
    occupied.append(x)
    return pygame.Rect(TILESIZE, x+TILESIZE, TILESIZE, TILESIZE)

walls = [generate_wall(50), generate_wall(TILESIZE*2)]

def get_space():
    # 4 poinnts

    # WIDTH / TI
    pass

a = pygame.Rect(TILESIZE, 10+TILESIZE, TILESIZE, TILESIZE)


def get_grid():
    grid = []
    for x in range(0, WIDTH, TILESIZE):
        for y in range(0, HEIGHT, TILESIZE):
            grid.append((x,y))

    return grid 

def draw_grid():
    grid = get_grid()
    grid_color = WHITE

    for e in grid: 
        pygame.draw.line(screen, grid_color, (e[0], 0), (e[0], HEIGHT))
        pygame.draw.line(screen, grid_color, (0, e[1]), (WIDTH, e[1]))

agent = Agent()
move_tick = 10


while running:
    # poll for events
    # pygame.QUIT event means the user clicked X to close your window
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # fill the screen with a color to wipe away anything from last frame
    screen.fill("black")

    # RENDER YOUR GAME HERE
    draw_grid()


    # if pressed[pygame.K_UP]: agent.y -= move_tick
    # if pressed[pygame.K_DOWN]: agent.y += move_tick
    # if pressed[pygame.K_LEFT]: agent.x -= move_tick
    # if pressed[pygame.K_RIGHT]: agent.x += move_tick

    if pressed:
        # print("MOVE: ", agent.x, agent.y)
        agent.move()

    for e in walls:
        pygame.draw.rect(screen, BLUE, e, TILESIZE//2, 0)
    pygame.draw.rect(screen, agent.color, agent.rect, TILESIZE//2, 0)
        
    # flip() the display to put your work on screen
    pygame.display.flip()

    clock.tick(30)  # limits FPS to 60

pygame.quit()