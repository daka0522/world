import numpy as np  
import pygame 
import time 

""" 
=====================================================================================
Logic 
1. World is created with spaces.
2. Cell is created with world.
3. Cell is born in the world.
4. Cell dies in the world.
5. Cell can be born in the world.
"""

class World: 
    """
    World is where all the object lives and dies.
    It gives spaces and some other informations.
    You can set the size of the world.
    """
    def __init__(self):
        self.HEIGHT = 5 
        self.WIDTH = 5 

        self.spaces = np.zeros((self.HEIGHT, self.WIDTH), dtype=Cell)

        self.lifes_ever = 0
        self.lifes = []

        self.foods_ever = 0
        self.foods = []

    def get_avialable_spaces(self) -> np.ndarray[np.ndarray[int], np.ndarray[int]]:
        """Search a free space and give it back."""
        return np.stack(np.where(self.spaces == 0), axis=1)


class Cell: 
    """ 
    Cell is a living one. it's born with name, age, color, face(direction).
    1. born: born with a given world
    2. die: die itself
    3. move: move somewhere
       """
    def __init__(self, world: World) -> None:
        self.world = world
        self.alive = False 
        self.current_location = None 
        self.color = None 
        self.age = 0
        self.born_time = None
        self.born()
        self.face = np.random.choice([0, 1, 2, 3])    # clock wise: front=0 -> right=1 -> back=2 -> left=3

    def born(self) -> None:
        location = self.get_space()
        if location is None:
            print("No available space")
        else:
            self.world.lifes_ever += 1 
            self.name = f"Cell_{self.world.lifes_ever}"
            self.born_time = time.time()

            self.world.spaces[location[0], location[1]] = self 
            self.current_location = location
            self.alive = True
            self.color = COLORS[np.random.choice(len(COLORS))]
            self.world.lifes.append(self)
    
    def die(self) -> None:
        if self.alive: 
            location = np.where(self.world.spaces == self)
            self.world.spaces[location[0], location[1]] = 0
            self.alive = False
            self.color = None 
        else:
            print("Cell is already dead")

    def get_space(self) -> None| np.ndarray:
        available_spaces = self.world.get_avialable_spaces()
        len_available_space = len(available_spaces)
        if len_available_space == 0:
            return None
        else:
            location = np.random.choice(len_available_space)
            return available_spaces[location]
            
    def __repr__(self):
        if self.alive:
            return f"{self.name}" 
        else: 
            return "Unborn Cell"

    # Aging system
    def aging(self) -> None:
        current_time = time.time()
        elapsed_time = np.round(current_time - self.born_time, 2)

        if self.alive and elapsed_time % 5:
            self.age += 1 
            self.color = self.color * 0.9

            if self.age > 10:
                self.die()
    
    def search_to_move(self):
        """
        Try to move with face(direction), get new location to move.
        There's some rules. It cant' move beyond the world mpa. So, the widht and height of the world.
        Secondly, it should have a logic to bump with other cells.
        """
        if self.face == 0:  # front
            new_location = self.current_location + np.array([0, -1])
        elif self.face == 1:    # right
            new_location = self.current_location + np.array([1, 0])
        elif self.face == 2:    # back
            new_location = self.current_location + np.array([0, 1])
        elif self.face == 3:    # left
            new_location = self.current_location + np.array([-1, 0]) 
        else:
            raise ValueError("Unknown face value. It must be {0, 1, 2, 3}")
        
        if 0 <= new_location[0] < self.world.HEIGHT and 0 <= new_location[1] < self.world.WIDTH:
            # print(f"Can move to {new_location}")

            # if move to new location, then update to self.world spaces. 1.remove past location, 2.add new location
            self.world.spaces = np.where(self.world.spaces == self, 0, self.world.spaces)
            self.world.spaces[new_location[0], new_location[1]] = self

            return new_location
        else:
            print(f"Impossible to move to {new_location}. Please turn your face.")
            self.turn_face()
            return self.current_location
        
    def move(self):
        self.current_location = self.search_to_move()

    def turn_face(self):
        # random choice
        new_face = np.where(self.face != [0, 1, 2, 3])[0]
        self.face = np.random.choice(new_face)


class Food:
    """
    food for cell
    1. location
    2. state {alive, dead}
    """
    def __init__(self, world: World):
        self.world = world 
        self.alive = False
        self.current_location = None 
        self.color = YELLOW
        self.born()

    def born(self):
        location = self.get_space()
        if location is None:
            raise Warning("No available space")
        else:
            self.world.foods_ever += 1 
            self.name = f"Food_{self.world.lifes_ever}"
            self.born_time = time.time()

            self.world.spaces[location[0], location[1]] = self 
            self.current_location = location
            self.alive = True
            self.world.foods.append(self)
    
    def die(self):
        if self.alive: 
            location = np.where(self.world.spaces == self)
            self.world.spaces[location[0], location[1]] = 0
            self.alive = False
            self.color = None 
            self.foods.remove(self)
        else:
            print(f"{self} is already dead")
        
    def get_space(self):
        available_spaces = self.world.get_avialable_spaces()
        len_available_space = len(available_spaces)
        if len_available_space == 0:
            return None
        else:
            location = np.random.choice(len_available_space)
            return available_spaces[location]

    def __repr__(self):
        if self.alive:
            return f"{self.name}" 
        else: 
            return "Unborn Cell"
""" 
=====================================================================================
2. Rendering the world
"""

# pygame setup
DISPLAY_WIDTH = 500
HEIGHT = 700

pygame.init()
screen = pygame.display.set_mode((DISPLAY_WIDTH, HEIGHT))
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
    tile_height = HEIGHT // world.HEIGHT

    for x in range(0, DISPLAY_WIDTH, tile_width):
        pygame.draw.line(screen, grid_color, (x, 0), (x, HEIGHT))
    for y in range(0, HEIGHT, tile_height):
        pygame.draw.line(screen, grid_color, (0, y), (DISPLAY_WIDTH, y))


def render_cell(cell: Cell, world: World, color=RED) -> None:
    """
    Render cell 

    Parameters
    ---------
    cell: Cell
    world: World
    color: (int, int, int)
        RGB value 0~255
    """
    width = DISPLAY_WIDTH // world.WIDTH
    height = HEIGHT // world.HEIGHT

    if cell.alive:
        x, y = cell.current_location
        x_position = x * width
        y_position = y * height

        rect = pygame.Rect(x_position, y_position, width, height) # (x, y, width, height)

        pygame.draw.rect(screen, color, rect)

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
            myfont = pygame.font.SysFont("Comic Sans MS", 20)
            label = myfont.render(f"{cell.name}, {cell.face} {arrow}, ({x_position}, {y_position})", 1, WHITE)
            screen.blit(label, (x_position, y_position))

world = World()

c1 = Cell(world)
# c2 = Cell(world)
# c3 = Cell(world)
# c4 = Cell(world)


food1 = Food(world)

"""
==============================================================
running
"""

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    screen.fill(BLACK)

    render_world(world)

    # if world.get_avialable_spaces().size == 0: 
    #     print("--------No available space--------")
    # else: 
    #     c = Cell(world)

    # for cell in world.lifes:
    #     render_cell(cell, world, cell.color)
    #     cell.aging()
    render_cell(c1, world, c1.color)
    render_cell(food1, world, food1.color)

    c1.move()

    # # elapsed_time = np.round(time.time() - c1.born_time)
    # # print(f"elapsed time: {elapsed_time}, color: {c1.color}")

    # c1.color = (c1.color * 0.9).astype(int)


    # render_cell(c2, world, c2.color)
    # render_cell(c3, world, c3.color)
    # render_cell(c4, world, c4.color)

    # c2.move()
    # c3.move()
    # c4.move()

    print(f"world.spaces: \n {world.spaces} \n \n")

    pygame.display.flip()
    clock.tick(1)
pygame.quit()