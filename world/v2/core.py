import numpy as np 
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
    def __init__(self, size: int):
        self.HEIGHT = size 
        self.WIDTH = size

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
        self.face = None 

        available_space = self.get_space()
        if available_space is not None:
            self.born(available_space)
        else:
            raise Exception("No available space")

    def born(self, available_space) -> None:
        self.world.spaces[available_space[0], available_space[1]] = self 
        self.world.lifes.append(self)
        self.world.lifes_ever += 1 
        
        self.alive = True
        self.current_location = available_space
        self.born_time = time.time()
        self.face = np.random.choice([0, 1, 2, 3])    # clock wise: front=0 -> right=1 -> back=2 -> left=3
        self.name = f"Cell_{self.world.lifes_ever}"
        self.color = COLORS[np.random.choice(len(COLORS))] 

    def die(self) -> None:
        if self.alive: 
            row, col = self.current_location
            if self.world.spaces[row, col] == self:
                self.world.spaces[row, col] = 0
            
            self.alive = False
            self.color = None 
            self.current_location = None 

            if self in self.world.lifes:
                self.world.lifes.remove(self)
        else:
            print("Cell is already dead")

    def get_space(self) -> None | np.ndarray:
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
            new_location = self.current_location + np.array([-1, 0])
        elif self.face == 1:    # right
            new_location = self.current_location + np.array([0, 1])
        elif self.face == 2:    # back
            new_location = self.current_location + np.array([1, 0])
        elif self.face == 3:    # left
            new_location = self.current_location + np.array([0, -1]) 
        else:
            raise ValueError("Unknown face value. It must be {0, 1, 2, 3}")
        
        return new_location

        """ if 0 <= new_location[0] < self.world.HEIGHT and 0 <= new_location[1] < self.world.WIDTH:
            # print(f"Can move to {new_location}")

            # if move to new location, then update to self.world spaces. 1.remove past location, 2.add new location
            self.world.spaces = np.where(self.world.spaces == self, 0, self.world.spaces)
            self.world.spaces[new_location[0], new_location[1]] = self

            return new_location
        else:
            print(f"Impossible to move to {new_location}. Please turn your face.")
            self.turn_face()
            return self.current_location """
        
    def ask_next_move(self):
        """ 
        1. Cell sends a location of next move to World.
        2. World respond to the cell, what's in the location it asked.
        """
        new_location = self.search_to_move()
        if 0 <= new_location[0] < self.world.HEIGHT and 0 <= new_location[1] < self.world.WIDTH:
            next_step = self.world.spaces[new_location[0], new_location[1]] 

            # print(f"search_to_move: {self.search_to_move()}")
            # print(f"next_step: {next_step}")

            if next_step == 0: # 0 means empty, so free to move
                self.move(new_location)
            else:
                self.turn_face()
        else:
            self.turn_face()
            # print("Not available to move next")

    def move(self, new_location):

        # Clear old location
        row, col = self.current_location 
        if self.world.spaces[row, col] == self:
            self.world.spaces[row, col] = 0
        # self.world.spaces = np.where(self.world.spaces == self, 0, self.world.spaces)
        
        # Update world spaces info
        self.current_location = new_location
        self.world.spaces[new_location[0], new_location[1]] = self

    def turn_face(self):
        # random choice
        new_face = np.where(self.face != [0, 1, 2, 3])[0] # except its previous face
        # faces = [0, 1, 2, 3]
        # faces.remove(self.face)
        # print(f"new face: {faces}")
        # self.face = np.random.choice(faces)
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
        self.color = np.array([255, 255, 0]) # YELLOW = np.array([255, 255, 0])
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