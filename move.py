import pygame
import math 

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
BLACK = (  0,   0,   0)
ORANGE = (255, 128, 0)
PURPLE = (128,0,128)

#CMY model
cmy_c = (1.0, 0.0, 0.0)
cmy_m = (0.0, 1.0, 0.0)
cmy_y = (0.0, 0.0, 1.0)


def cmy2rgb(color):
    c = color[0]
    m = color[1]
    y = color[2]

    r = 255 * (1- c)
    g = 255 * (1- m) 
    b = 255 * (1-y)
    return (r, g, b)

# pygame setup
pygame.init()
screen = pygame.display.set_mode((WIDTH, HEIGHT))
clock = pygame.time.Clock()
running = True

def draw_grid():
    grid_color = WHITE
	#0부터 TILESIZE씩 건너뛰면서 WIDTH까지 라인을 그려준다
    for x in range(0, WIDTH, TILESIZE):
    	#첫번째 인자부터 game_world(게임 화면)에 (0,0,0,50)의 색으로 차례대로 라인을 그려준다
        pygame.draw.line(screen, grid_color, (x, 0), (x, HEIGHT))
    for y in range(0, HEIGHT, TILESIZE):
        pygame.draw.line(screen, grid_color, (0, y), (WIDTH, y))

def scalar_add(c1, c2):
    v1 = (c1[0] + c2[0]) 
    v2 = (c1[1]+ c2[1]) 
    v3 = (c1[2] + c2[2]) 
    return (v1, v2, v3)

def color_add(c1, c2):
    r = (c1[0] + c2[0]) // 2
    g = (c1[1]+ c2[1]) // 2
    b = (c1[2] + c2[2]) // 2
    return pygame.Color(r, g, b)

c = pygame.draw.circle(screen, ORANGE, (TILESIZE, TILESIZE), TILESIZE//2, 0)

pressed = pygame.key.get_pressed()
x = 100
y = 100
move_tick = 10
angle = 0
angle2 = 0
color_value = 0

maybe_orange = color_add(YELLOW, RED)
maybe_purple = color_add(RED, BLUE)
maybe_green = color_add(YELLOW, BLUE)
maybe_pink = color_add(RED, WHITE)
maybe_skyblue = color_add(BLUE, WHITE)
maybe_black = color_add(color_add(RED, YELLOW), BLUE)
maybe_black2 = color_add(maybe_black, maybe_black)


a = scalar_add(cmy_c, cmy_m)
t1 = cmy2rgb(a)
t2 = scalar_add(cmy_c, cmy_y)
t3 = scalar_add(cmy_m, cmy_y) 

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
    
    pressed = pygame.key.get_pressed()

    if pressed[pygame.K_UP]: y -= move_tick
    if pressed[pygame.K_DOWN]: y += move_tick
    if pressed[pygame.K_LEFT]: x -= move_tick
    if pressed[pygame.K_RIGHT]: x += move_tick

    c = pygame.draw.circle(screen, maybe_orange, (x, y), TILESIZE//2, 0)


    # Circular movement 1   
    angle += 0.05
    x1 = int(math.cos(angle) * 50) 
    y1 = int(math.sin(angle) * 50) 
    pygame.draw.circle(screen, maybe_purple, (x + x1, y + y1), TILESIZE//3, 0)

    # Circular movement 2
    angle2 += 0.1
    x2 = int(math.cos(angle2) * 100) 
    y2 = int(math.sin(angle2) * 100) 

    if color_value < 255:
        color_value += 0.5
    else:
        color_value = 0
    pygame.draw.circle(screen, (0, color_value, 0), (x + x2, y + y2), TILESIZE//4, 0)

    # Circular movement 3
    angle += 0.05
    x3 = int(math.cos(angle) * 150) 
    y3 = int(math.sin(angle) * 150) 
    pygame.draw.circle(screen, maybe_pink, (x + x3, y + y3), TILESIZE//5, 0)


    # Circular movement 4
    angle += 0.01
    x4 = int(math.cos(angle) * 200) 
    y4 = int(math.sin(angle) * 200) 
    pygame.draw.circle(screen, cmy2rgb(cmy_c), (50, 200), TILESIZE//2, 0)
    pygame.draw.circle(screen, cmy2rgb(cmy_m), (100, 200), TILESIZE//2, 0)
    pygame.draw.circle(screen, cmy2rgb(cmy_y), (150, 200), TILESIZE//2, 0)
    pygame.draw.circle(screen, t1, (200, 200), TILESIZE//2, 0)
    pygame.draw.circle(screen, cmy2rgb(t2), (250, 200), TILESIZE//2, 0)
    pygame.draw.circle(screen, cmy2rgb(t3), (300, 200), TILESIZE//2, 0)
    pygame.draw.circle(screen, maybe_black, (350, 200), TILESIZE//2, 0)
    pygame.draw.circle(screen, maybe_black2, (400, 200), TILESIZE//2, 0)
    pygame.draw.circle(screen, maybe_skyblue, (450, 200), TILESIZE//2, 0)
    
    
    # flip() the display to put your work on screen
    pygame.display.flip()

    clock.tick(60)  # limits FPS to 60

pygame.quit()