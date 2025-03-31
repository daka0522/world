import numpy as np 

import pygame 
from core import Env, Agent 


env = Env()
agent = Agent(env)



""" Rendering  """
# pygame setup
size = 800
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


def render_world(env: Env) -> None:
    grid_color = WHITE 

    tile_width = DISPLAY_WIDTH // env.WIDTH
    tile_height = DISPLAY_HEIGHT // env.HEIGHT

    for x in range(0, DISPLAY_WIDTH, tile_width):
        pygame.draw.line(screen, grid_color, (x, 0), (x, DISPLAY_HEIGHT))
    for y in range(0, DISPLAY_HEIGHT, tile_height):
        pygame.draw.line(screen, grid_color, (0, y), (DISPLAY_WIDTH, y))


def render_agent(agent: Agent, world: Env, color=RED, rendering_face=False) -> None:
    width = DISPLAY_WIDTH / world.WIDTH
    height = DISPLAY_HEIGHT / world.HEIGHT

    row, col = agent.state
    x_position = col * height
    y_position = row * width

    rect = pygame.Rect(x_position, y_position, width, height) # (x, y, width, height)
    pygame.draw.rect(screen, color, rect)

    if rendering_face:
        render_face(agent, x_position, y_position)

def render_face(cell: Agent, x_position, y_position):
        myfont = pygame.font.SysFont("Comic Sans MS", 15)

        label = myfont.render(f"{cell.state}", 1, WHITE, BLACK)
        label2 = myfont.render(f"{cell.reward} ", 1, WHITE, BLACK)

        # Rendering
        screen.blit(label, (x_position+10, y_position+50))
        screen.blit(label2, (x_position+10, y_position+80))


def render_reward_map(agent:Agent, env: Env):
    width = DISPLAY_WIDTH / env.WIDTH
    height = DISPLAY_HEIGHT / env.HEIGHT

    myfont = pygame.font.SysFont("Arial", 15)
    
    for x in range(env.HEIGHT):
        for y in range(env.WIDTH):
            map_info = myfont.render(f"{(x, y)}, {agent.memory[x, y]}", 1, WHITE, BLACK)
            screen.blit(map_info, (y*width, x*height))



while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    screen.fill(BLACK)

    render_world(env)

    render_agent(agent, env, rendering_face=True)

    render_reward_map(agent, env)


    history = agent.expect(agent.state)
    action = agent.best_action(history)
    new_state = agent.state_transition(action)
    reward = env.next_step(tuple(new_state))
    agent.memory[tuple(agent.state)][agent.actions.index(action)] +=  reward

    move_to_new_state = agent.move_to_state(new_state)
   
    agent.state = move_to_new_state
    agent.reward += reward
    print(f"Agent memory map {agent.memory}")

    pygame.display.flip()
    clock.tick(10)
pygame.quit()