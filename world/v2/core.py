import numpy as np 
import time 
from collections import defaultdict

""" 
=====================================================================================
Logic 
1. World is created with spaces.
2. Cell is created with world.
3. Cell is born in the world.
4. Cell dies in the world.
5. Cell can be born in the world.
"""

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




class World: 
    """
    World is where all the object lives and dies.
    It gives spaces and some other informations.
    You can set the size of the world.
    """
    def __init__(self, size: int=10):
        self.HEIGHT = size 
        self.WIDTH = size

        self.spaces: np.ndarray = np.zeros((self.HEIGHT, self.WIDTH), dtype=object)

        self.matter: dict[str, any] = defaultdict(list)
        self.matter_count: dict[str, int] = defaultdict(int)


    def get_avialable_spaces(self) -> np.ndarray[np.ndarray[int], np.ndarray[int]]:
        """Search a free space and give it back."""
        return np.stack(np.where(self.spaces == 0), axis=1)


class Matter:
    """
    Proto type of life.
    Sub classes: Cell, Food
    """
    def __init__(self, world: World) -> None:
        self.world: World = world
        self.is_alive = False 
        self.current_location: tuple[int, int] | None = None 
        self.color: tuple[int, int, int] = None
        self.age: int = 0 
        self.born_time: time.time = None 
        self.name: str = None 
        self.class_name: str = self.__class__.__qualname__

        # If there's free space, then it can born.
        available_space = self.get_space()
        if available_space is None:
            raise Exception("No available space")
        else:
            self.born(available_space)

    def get_space(self) -> None | np.ndarray:
        available_spaces = self.world.get_avialable_spaces()
        len_available_space = len(available_spaces)
        if len_available_space == 0:
            return None
        else:
            location = np.random.choice(len_available_space)
            return available_spaces[location]
        
    def born(self, available_space) -> None:
        self.world.spaces[available_space[0], available_space[1]] = self 
        self.world.matter[self.class_name].append(self) # for examples: 'Cell': [instacnes..]
        self.world.matter_count[self.class_name] += 1

        self.is_alive = True
        self.current_location = available_space
        self.born_time = time.time()
        self.name = f"{self.class_name}_{self.world.matter_count[self.class_name]}"
        self.color = COLORS[np.random.choice(len(COLORS))] 
    
    def die(self) -> None: 
        if self.is_alive: 
            row, col = self.current_location
            if self.world.spaces[row, col] == self:
                self.world.spaces[row, col] = 0
            
            self.is_alive = False
            self.color = None 
            self.current_location = None 

            if self in self.world.matter[self.class_name]:
                self.world.matter[self.class_name].remove(self)
        else:
            print(f"{self.name} is already dead")

    def __repr__(self):
        if self.is_alive:
            return f"{self.name}is is_alive." 
        else: 
            return f"Unborn {self.class_name}"


class Food(Matter):
    """
    food for cell
    1. location
    2. state {is_alive, dead}
    """
    def __init__(self, world: World):
        super().__init__(world)
        self.energy: int = 20


class Cell(Matter): 
    """ 
    Cell is a living one. it's born with name, age, color, face(direction).
    1. born: born with a given world
    2. die: die itself
    3. move: move somewhere
    4. eat
       """
    def __init__(self, world: World) -> None:
        # Only for cell(mover).
        self.face: int[0, 1, 2, 3] = None 
        self.energy = 50
        self.MAX_ENERGY = 100

        super().__init__(world)

    def born(self, available_space) -> None:
        super().born(available_space)
        self.face = np.random.choice([0, 1, 2, 3])    # clock wise: front=0 -> right=1 -> back=2 -> left=3

    # Aging system
    def aging(self) -> None:
        current_time = time.time()
        elapsed_time = np.round(current_time - self.born_time, 2)

        if self.is_alive and elapsed_time % 5:
            self.age += 1 
            self.color = self.color * 0.975

            if self.age > 100:
                self.die()
    
    def sense_front(self, sense_reach: int = 1):
        """
        Try to move with face(direction), get new location to move.
        There's some rules. It cant' move beyond the world map. So, the widht and height of the world.
        Secondly, it should have a logic to bump with other cells.
        
        Parameters
        ----------

        sense_reach: how far to sense (window size)
        """
        if self.face == 0:  # front
            new_location = self.current_location + np.array([-sense_reach, 0])
        elif self.face == 1:    # right
            new_location = self.current_location + np.array([0, sense_reach])
        elif self.face == 2:    # back
            new_location = self.current_location + np.array([sense_reach, 0])
        elif self.face == 3:    # left
            new_location = self.current_location + np.array([0, -sense_reach]) 
        else:
            raise ValueError("Unknown face value. It must be {0, 1, 2, 3}")
        return new_location
        
    def ask_next_move(self):
        """ 
        1. Cell sends a location of next move to World.
        2. World respond to the cell, what's in the location it asked.
        """
        new_location = self.sense_front()
        inside_world = 0 <= new_location[0] < self.world.HEIGHT and 0 <= new_location[1] < self.world.WIDTH
        
        if inside_world:
            whats_next = self.world.spaces[new_location[0], new_location[1]] 

            # print(f"whats_next: {whats_next}")

            # If it's empty then go. 0 means empty, so free to move
            if whats_next == 0 and self.energy > 10: 

                self.move(new_location)
            # If it's a food then eat it.
            elif isinstance(whats_next, Food):
                self.eat(whats_next)
            else:
                self.turn_face()
        else:
            self.turn_face()
            # print("Not available to move next")

    def move(self, new_location) -> None:
        # Clear old location
        row, col = self.current_location 
        if self.world.spaces[row, col] == self:
            self.world.spaces[row, col] = 0
        
        # Update world spaces info
        self.current_location = new_location
        self.world.spaces[new_location[0], new_location[1]] = self

        # consumtion and aging option: age +1 per a move.
        # self.age += 1
        self.energy -= 1

    def turn_face(self) -> None:
        # random choice
        new_face = np.where(self.face != [0, 1, 2, 3])[0] # except its previous face
        self.face = np.random.choice(new_face)

    def eat(self, food: Food) -> None:
        self.energy += food.energy
        food.die()




        