import numpy as np 
import pygame 

# pygame setup
size = 600
DISPLAY_WIDTH = size
DISPLAY_HEIGHT = size 

pygame.init()
screen = pygame.display.set_mode((DISPLAY_WIDTH, DISPLAY_HEIGHT))
clock = pygame.time.Clock()
running = True  


WHITE = np.array([255, 255, 255])
GREEN = np.array([0, 255, 0])
BLACK = np.array([0, 0, 0])


# Parameters

colors = np.random.randint(0, 255, (3, 3))

step_min = 99
step_max = 150

step0 = np.random.randint(step_min, step_max)
step1 = np.random.randint(step_min, step_max)
step2 = np.random.randint(step_min, step_max)

end_line = 50


# Gradients

c0 = np.linspace(WHITE, colors[0], end_line, dtype=np.uint8)
c1 = np.linspace(colors[0], colors[1], step1, dtype=np.uint8)
c2 = np.linspace(colors[1], colors[2], step2, dtype=np.uint8)
c3 = np.linspace(colors[2], colors[1], step2, dtype=np.uint8)
c4 = np.linspace(colors[1], colors[0], step1, dtype=np.uint8)
c5 = np.linspace(colors[0], WHITE, end_line, dtype=np.uint8)

cc = np.concatenate((c0, c1, c2, c3, c4, c5))


x_position = 0
y_position = 0
width = size
height = size

rect = pygame.Rect(x_position, y_position, width, height) # (x, y, width, height)
# pygame.draw.rect(screen, tuple(WHITE), rect)


# Render



color_index = 0  # Start with the first color in the gradient
    

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    screen.fill(tuple(WHITE))


    # # Update the rectangle's color
    # current_color = tuple(cc[color_index])
    # pygame.draw.rect(screen, current_color, rect)

    # # Increment the color index to cycle through the gradient
    # color_index = (color_index + 1) % len(cc)  # Loop back to the start when reaching the end

    width = size//len(cc)
    print(width)


    # for i, color in enumerate(cc):
    #     pygame.draw.line(screen, cc[i], (0, i), (size, i), width=2)
    
    pygame.draw.line(screen, cc[color_index], (0, 2), (size, 2), width=200)
    color_index = (color_index + 1) % len(cc)  # Loop back to the start when reaching the end


    pygame.display.flip()
    clock.tick(30)
pygame.quit()