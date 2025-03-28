import pygame
import math 
import logic
import random 

WIDTH = 500
HEIGHT = 500
TILE = 10
TILESIZE = HEIGHT // TILE

#set up the colors
WHITE = (255, 255, 255)
YELLOW = (255, 255, 0)
RED   = (255,   0,   0)
BLUE = (0, 128, 255)
GREEN = (0, 255, 0)
ORANGE = (255, 128, 0)
PURPLE = (128,0,128)
BLACK = (  0,   0,   0)

COLORS = [WHITE, YELLOW, RED, BLUE, GREEN, ORANGE, PURPLE]

# pygame setup
pygame.init()
screen = pygame.display.set_mode((WIDTH, HEIGHT))
clock = pygame.time.Clock()
running = True

def draw_grid():
    grid_color = WHITE
    for x in range(0, WIDTH, TILESIZE):
        pygame.draw.line(screen, grid_color, (x, 0), (x, HEIGHT))
    for y in range(0, HEIGHT, TILESIZE):
        pygame.draw.line(screen, grid_color, (0, y), (WIDTH, y))


def random_move(value):
    # return random.randrange(0, HEIGHT, TILESIZE)
    r = random.choice([-1, 0, +1]) * TILESIZE
    result = 0
    # if it's over height. then stop
    if r + value <= 0 :
        result = 0
    # if it's over window it can't move
    elif r + value >= HEIGHT:
        result = HEIGHT
    else:
        result = r + value

    print("R", r)
    return result

def move_up(position):
    new_position = position - TILESIZE
    # if new_position >= 0:
    return new_position
    # Over ceil, can't move. (can't get new position)
    # elif new_position < 0:
    #     return move_down(position)
    # else:
    #     return move_down(position)

def move_down(position):
    new_position = position + TILESIZE
    # if new_position < HEIGHT:
    print("Down: ", new_position)
    return new_position
    # elif new_position >= HEIGHT:
    #     return move_up(position)
    # elif new_position >= 0:
    #     return position

# def move_logic(x, y):
#     r * x

x = 0 + TILESIZE//2
y = HEIGHT - TILESIZE//2

y2 = HEIGHT - TILESIZE//2

turn = True
while running:
    # poll for events
    # pygame.QUIT event means the user clicked X to close your window
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # fill the screen with a color to wipe away anything from last frame
    screen.fill("black")

    # play

    # print(random_move()* y)

    y = random_move(y)
    print(y)
    
    pygame.draw.circle(screen, ORANGE, (x, y), TILESIZE//2, 0)
    pygame.draw.circle(screen, BLUE, (100+ TILESIZE//2, random_move(y)), TILESIZE//2, 0)
    pygame.draw.circle(screen, random.choice(COLORS), (150+ TILESIZE//2, random_move(y)), TILESIZE//2, 0)
    pygame.draw.circle(screen, random.choice(COLORS), (200+ TILESIZE//2, random_move(y)), TILESIZE//2, 0)
    pygame.draw.circle(screen, random.choice(COLORS), (250+ TILESIZE//2, random_move(y)), TILESIZE//2, 0)
    pygame.draw.circle(screen, random.choice(COLORS), (300+ TILESIZE//2, random_move(y)), TILESIZE//2, 0)
    pygame.draw.circle(screen, random.choice(COLORS), (350+ TILESIZE//2, random_move(y)), TILESIZE//2, 0)
    pygame.draw.circle(screen, random.choice(COLORS), (400+ TILESIZE//2, random_move(y)), TILESIZE//2, 0)
    pygame.draw.circle(screen, random.choice(COLORS), (450+ TILESIZE//2, random_move(y)), TILESIZE//2, 0)
    pygame.draw.circle(screen, random.choice(COLORS), (500+ TILESIZE//2, random_move(y)), TILESIZE//2, 0)

    # if turn and (y2 > 0):
    #     r = move_up(y2)
    #     print("Move")
    # elif y2 <= 0:
    #     turn = False
    # elif turn == False:
    #     r = move_down(y2)
    #     print('turn: ', turn, r)
    # y2 = r
    # print('y2: ', y2)
    # c1 = pygame.draw.circle(screen, BLUE, (100, y2), TILESIZE//2, 0)
    

    # flip() the display to put your work on screen
    pygame.display.flip()

    clock.tick(10)  # limits FPS to 60

pygame.quit()