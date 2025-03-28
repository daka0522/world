import pygame
import random
import numpy as np

# World space settings
WIDTH = 1200
HEIGHT = 800
TILE = 30
TILESIZE = HEIGHT // TILE

# Display settings
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

# Pygame setup
pygame.init()
screen = pygame.display.set_mode((DISPLAY_WIDTH, HEIGHT))
clock = pygame.time.Clock()
running = True

# Constants
REPRODUCTION_AGE_MIN = 20
REPRODUCTION_AGE_MAX = 25
MAX_POPULATION = (TILE - 1) * (TILE - 2)
DEATH_AGE = 70
MOVE_CHANCE = 0.8
DIRECTION_CHANGE_CHANCE = 0.1
COGNITION_RANGE = 1  # Number of tiles away a cell can "see" neighbors


def color_add(c1, c2):
    r = (c1[0] + c2[0]) // 2
    g = (c1[1] + c2[1]) // 2
    b = (c1[2] + c2[2]) // 2
    return pygame.Color(r, g, b)


class World:
    def __init__(self):
        self.grid = np.zeros((TILE, TILE), dtype=object)  # Use a NumPy array for the grid
        self.lifes = []
        self.born = 0
        self.death = 0

    def add_cell(self, cell):
        self.lifes.append(cell)
        self.grid[cell.row, cell.col] = cell
        self.born += 1

    def remove_cell(self, cell):
        self.lifes.remove(cell)
        self.grid[cell.row, cell.col] = None
        self.death += 1

    def get_neighbors(self, row, col, range=1):
        neighbors = []
        for dr in range(-range, range + 1):
            for dc in range(-range, range + 1):
                if dr == 0 and dc == 0:
                    continue  # Skip self

                new_row = row + dr
                new_col = col + dc

                if 0 <= new_row < TILE and 0 <= new_col < TILE and self.grid[new_row, new_col] is not None:
                    neighbors.append(self.grid[new_row, new_col])
        return neighbors


WORLD = World()


class Cell:
    def __init__(self, name, color=None):
        self.name = name
        self.age = 0
        self.alive = True
        row_col = self.find_empty_spot()
        if row_col:
            self.row, self.col = row_col  # Get row and col from find_empty_spot
            self.x = self.col * TILESIZE + TILESIZE // 2  # Calculate x and y from row and col
            self.y = self.row * TILESIZE + TILESIZE // 2
            self.color = color if color else random.choice([WHITE, YELLOW, RED, BLUE])
            self.color_changed = 0
            self.direction = random.choice([(1, 0), (-1, 0), (0, 1), (0, -1)])  # Initial direction
            WORLD.add_cell(self)
        else:
            self.alive = False # If no space, mark as not alive.
            print("No space for cell:", name)

    def find_empty_spot(self):
        empty_spots = np.where(WORLD.grid == None)
        if len(empty_spots[0]) > 0:  # Check if there are empty spots
            index = random.randint(0, len(empty_spots[0]) - 1)
            row = empty_spots[0][index]
            col = empty_spots[1][index]
            return row, col
        else:
            return None  # No space available

    def move(self):
        if not self.alive:
            return  # Don't move dead cells

        if random.random() < MOVE_CHANCE:
            if random.random() < DIRECTION_CHANGE_CHANCE:
                self.direction = random.choice([(1, 0), (-1, 0), (0, 1), (0, -1)])

            new_col = self.col + self.direction[0]
            new_row = self.row + self.direction[1]

            if 0 <= new_row < TILE and 0 <= new_col < TILE and WORLD.grid[new_row, new_col] is None:
                # Update the grid
                WORLD.grid[self.row, self.col] = None
                self.row = new_row
                self.col = new_col
                WORLD.grid[self.row, self.col] = self

                # Update x and y coordinates
                self.x = self.col * TILESIZE + TILESIZE // 2
                self.y = self.row * TILESIZE + TILESIZE // 2

        self.age += 1
        self.cognize()

        rect = pygame.Rect(self.x - (TILESIZE // 2), self.y - (TILESIZE // 2), TILESIZE, TILESIZE)
        pygame.draw.rect(screen, self.color, rect, TILESIZE // 2, 0)

        if REPRODUCTION_AGE_MIN < self.age < REPRODUCTION_AGE_MAX and len(WORLD.lifes) < MAX_POPULATION:
            self.reproduction()

        if self.age > DEATH_AGE:
            self.death()

    def reproduction(self):
        if np.any(WORLD.grid == None):  # Check for empty spots directly
            Cell('C' + str(WORLD.born))

    def death(self):
        self.alive = False
        WORLD.remove_cell(self)

    def cognize(self):
        neighbors = WORLD.get_neighbors(self.row, self.col, COGNITION_RANGE)

        if self.color_changed <= 3:
            for cell in neighbors:
                self.color = color_add(self.color, cell.color)
                self.color_changed += 1


def draw_grid():
    for x in range(0, WIDTH, TILESIZE):
        pygame.draw.line(screen, BLACK, (x, 0), (x, HEIGHT))
    for y in range(0, HEIGHT, TILESIZE):
        pygame.draw.line(screen, BLACK, (0, y), (WIDTH, y))


# Initial cells (start with more)
num_initial_cells = 10
initial_cells = []
for i in range(num_initial_cells):
    initial_cells.append(Cell(f"c{i}"))

# Font
myFont = pygame.font.SysFont("arial", 20)

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    screen.fill("black")

    draw_grid()

    # Iterate backwards to allow safe removal
    for cell in WORLD.lifes[:]:
        cell.move()

    # Display info
    lifes_text = myFont.render("Lifes: " + str(len(WORLD.lifes)), True, WHITE)
    born_text = myFont.render("Born: " + str(WORLD.born), True, WHITE)
    death_text = myFont.render("Death: " + str(WORLD.death), True, WHITE)

    screen.blit(lifes_text, [WIDTH + 50, 50])
    screen.blit(born_text, [WIDTH + 50, 100])
    screen.blit(death_text, [WIDTH + 50, 150])

    pygame.display.update()
    clock.tick(20)

pygame.quit()