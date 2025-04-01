import pygame
import random
import numpy as np

# World space setting
WIDTH = 1100
HEIGHT = 700
TILE = 100
TILESIZE = HEIGHT // TILE
DISPLAY_WIDTH = WIDTH + 250

#set up the colors
WHITE = (255, 255, 255)
YELLOW = (255, 255, 0)
RED = (255, 0, 0)
BLUE = (0, 0, 255)
GREEN = (0, 255, 0)
BLACK = (0, 0, 0)
ORANGE = (255, 128, 0)
PURPLE = (128, 0, 128)

# Colors as a NumPy array for faster access
COLORS = np.array([WHITE, YELLOW, RED, BLUE, GREEN, ORANGE, PURPLE], dtype=np.uint8)

# Pygame setup
pygame.init()
screen = pygame.display.set_mode((DISPLAY_WIDTH, HEIGHT))
clock = pygame.time.Clock()
running = True

def color_add(c1, c2):
    """Color addition with overflow handling."""
    r = (int(c1[0]) + int(c2[0])) // 2
    g = (int(c1[1]) + int(c2[1])) // 2
    b = (int(c1[2]) + int(c2[2])) // 2
    return (r, g, b)

def get_circumstance(pos, tilesize):
    """Get surrounding cell positions."""
    x, y = pos
    ts = tilesize
    return [
        (x - ts, y - ts), (x, y - ts), (x + ts, y - ts),
        (x - ts, y),      (x, y),      (x + ts, y),
        (x - ts, y + ts), (x, y + ts), (x + ts, y + ts)
    ]

class World:
    def __init__(self):
      self.space = np.array([(x, y) for x in range(TILESIZE, WIDTH, TILESIZE) for y in range(TILESIZE, HEIGHT, TILESIZE)], dtype=np.int16)
      self.occupied_dict = {}  # Dictionary for faster lookup
      self.born = 0
      self.lifes = []  # List to hold Cell *indices*
      self.death = 0
      # NumPy array for cell data: x, y, age, color_index, alive_flag
      self.cell_data = np.zeros((TILE * TILE, 5), dtype=np.int32)
      self.free_cell_indices = list(range(TILE * TILE)) # Track free slots
      self.num_cells = 0

    def add_cell(self, position, color_index):
      if self.free_cell_indices:
          cell_index = self.free_cell_indices.pop()
          self.cell_data[cell_index, 0] = position[0]
          self.cell_data[cell_index, 1] = position[1]
          self.cell_data[cell_index, 2] = 0  # age
          self.cell_data[cell_index, 3] = color_index
          self.cell_data[cell_index, 4] = 1  # alive = True
          self.lifes.append(cell_index)
          self.occupied_dict[tuple(position)] = cell_index  # Store as tuple
          self.born += 1
          self.num_cells += 1
          return cell_index
      return -1

    def remove_cell(self, cell_index):
      position = (self.cell_data[cell_index, 0], self.cell_data[cell_index, 1])
      self.cell_data[cell_index, 4] = 0  # alive = False
      self.free_cell_indices.append(cell_index)
      if cell_index in self.lifes: # Check to prevent error
          self.lifes.remove(cell_index) # Prevent error
      if tuple(position) in self.occupied_dict:
          del self.occupied_dict[tuple(position)]
      self.death += 1
      self.num_cells -= 1

    def get_cell_color(self, cell_index):
      color_index = self.cell_data[cell_index, 3]
      return COLORS[color_index]

    def update(self):
        np.random.shuffle(self.lifes)
        for cell_index in self.lifes:
            self.move_cell(cell_index)

        surface_array = np.zeros((WIDTH, HEIGHT, 3), dtype=np.uint8)
        for cell_index in self.lifes:
            x, y, _, color_index, alive = self.cell_data[cell_index]
            if alive:
                color = COLORS[color_index]
                x_start = max(0, x - TILESIZE // 2)
                y_start = max(0, y - TILESIZE // 2)
                x_end = min(WIDTH, x + TILESIZE // 2)
                y_end = min(HEIGHT, y + TILESIZE // 2)
                surface_array[x_start:x_end, y_start:y_end, :] = color

        cell_surface = pygame.Surface((WIDTH, HEIGHT))
        pygame.surfarray.blit_array(cell_surface, surface_array)
        screen.blit(cell_surface, (0, 0))


    def move_cell(self, cell_index):
        if self.cell_data[cell_index, 4] == 1:  # If alive
            x, y, age, color_index, _ = self.cell_data[cell_index]
            pos = (x, y)
            circumstance = get_circumstance(pos, TILESIZE)
            available_moves = []

            occupied_indices = []
            for neighbor_pos in circumstance:
                neighbor_idx = self.occupied_dict.get(neighbor_pos, -1) # Dictionary lookup
                if neighbor_idx != -1:
                    occupied_indices.append(neighbor_idx)
                elif (neighbor_pos[0] >= TILESIZE and neighbor_pos[0] < WIDTH and
                      neighbor_pos[1] >= TILESIZE and neighbor_pos[1] < HEIGHT):
                    available_moves.append(neighbor_pos)

            # Move
            if available_moves:
                new_pos = random.choice(available_moves)
                # Check if the old position exists before deleting
                if (x, y) in self.occupied_dict:
                    del self.occupied_dict[(x, y)]
                self.occupied_dict[new_pos] = cell_index # Add new position.
                self.cell_data[cell_index, 0] = new_pos[0]
                self.cell_data[cell_index, 1] = new_pos[1]
                x, y = new_pos  # Update x and y

            # Interaction (color change)
            color_changes = 0
            for neighbor_idx in occupied_indices:
                if neighbor_idx != cell_index and color_changes < 3:
                    neighbor_color_index = self.cell_data[neighbor_idx, 3]
                    new_color = color_add(COLORS[color_index], COLORS[neighbor_color_index])
                    # Find the closest color index (can be optimized with a lookup table)
                    new_color_index = -1
                    for k in range(COLORS.shape[0]):
                        if np.array_equal(COLORS[k], new_color):
                            new_color_index = k
                            break
                    if new_color_index == -1:
                        new_color_index = 0 #prevent error, use 0 if not exist
                    self.cell_data[cell_index, 3] = new_color_index
                    color_index = new_color_index
                    color_changes += 1

            # Age and Death
            self.cell_data[cell_index, 2] += 1
            if self.cell_data[cell_index, 2] > 70:
                self.remove_cell(cell_index)
                return  # Return after removing

            # Reproduction
            if 20 < self.cell_data[cell_index, 2] < 25:
                if self.num_cells < ((TILE - 1) * (TILE - 2)):
                    if available_moves:
                        new_cell_pos = random.choice(available_moves)
                        self.add_cell(new_cell_pos, np.random.randint(0, len(COLORS)))


WORLD = World()

# Create initial cells
for _ in range(3):
  WORLD.add_cell(random.choice(WORLD.space), random.randint(0, len(COLORS)-1))

def draw_grid():
    grid_color = BLACK
    for x in range(0, WIDTH, TILESIZE):
        pygame.draw.line(screen, grid_color, (x, 0), (x, HEIGHT))
    for y in range(0, HEIGHT, TILESIZE):
        pygame.draw.line(screen, grid_color, (0, y), (WIDTH, y))

myFont = pygame.font.SysFont("arial", 20)

# pre-calculate all text surface
texts = {}
def update_texts():
  texts['lifes'] = myFont.render("Lifes: " + str(WORLD.num_cells), True, WHITE)
  texts['space'] = myFont.render("Space: " + str(len(WORLD.space)), True, WHITE)
  texts['occupied'] = myFont.render("Occupied: " + str(len(WORLD.occupied_dict)), True, WHITE)
  texts['total_space'] = myFont.render("Total Space: " + str(len(WORLD.space) + len(WORLD.occupied_dict)), True, WHITE)
  texts['born'] = myFont.render("Born: " + str(WORLD.born), True, WHITE)
  texts['death'] = myFont.render("Death: " + str(WORLD.death), True, WHITE)
update_texts()

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 1:
                mouse_x, mouse_y = event.pos
                if TILESIZE <= mouse_x < WIDTH and TILESIZE <= mouse_y < HEIGHT:
                    grid_x = (mouse_x // TILESIZE) * TILESIZE
                    grid_y = (mouse_y // TILESIZE) * TILESIZE
                    clicked_pos = (grid_x, grid_y)
                    if clicked_pos not in WORLD.occupied_dict:
                        WORLD.add_cell(clicked_pos, random.randint(0, len(COLORS) - 1))
                        update_texts()

    screen.fill(BLACK)
    # draw_grid()  # Optional

    WORLD.update()

    screen.blit(texts['lifes'], [WIDTH+50, 50])
    screen.blit(texts['space'], [WIDTH+50, 100])
    screen.blit(texts['occupied'], [WIDTH+50, 150])
    screen.blit(texts['total_space'], [WIDTH+50, 200])
    screen.blit(texts['born'], [WIDTH+50, 250])
    screen.blit(texts['death'], [WIDTH+50, 300])
    update_texts()

    pygame.display.update()
    clock.tick(60)

pygame.quit()